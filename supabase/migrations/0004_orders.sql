-- Fase 4: pedidos, itens do pedido e reserva de estoque com expiração automática.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0001-0003.
-- Pré-requisito: a extensão pg_cron precisa estar habilitada (Database > Extensions).

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'shipped', 'cancelled', 'expired')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  frete_valor numeric(10,2) not null default 0 check (frete_valor >= 0),
  total numeric(10,2) not null check (total >= 0),
  cep_destino text not null,
  endereco_json jsonb not null default '{}'::jsonb,
  mp_preference_id text,
  mp_payment_id text,
  reserved_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.orders(user_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  created_at timestamptz not null default now()
);

create index on public.order_items(order_id);

create table public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantidade integer not null check (quantidade > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index on public.stock_reservations(expires_at);
create index on public.stock_reservations(product_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stock_reservations enable row level security;

-- Cliente só enxerga os próprios pedidos; admin enxerga tudo. Sem policy de INSERT/UPDATE/DELETE
-- para o client: pedidos só são criados/alterados pela função security definer abaixo (ou pelo
-- webhook do Mercado Pago, na Fase 5, que usa a service role key).
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_select_admin" on public.orders for select using (public.is_admin());

create policy "order_items_select_own" on public.order_items for select
  using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "order_items_select_admin" on public.order_items for select using (public.is_admin());

-- stock_reservations: sem policy de acesso direto do cliente (nem select) — é detalhe interno de
-- controle de estoque, exposto ao cliente só através do pedido/reserved_until.

-- Cria um pedido de forma atômica: recalcula preços a partir do banco (nunca confia no cliente),
-- reserva o estoque de cada item e expira em p_minutos se não for pago. Se qualquer item não tiver
-- estoque suficiente, a função inteira falha e o Postgres desfaz tudo (nada fica órfão).
create or replace function public.criar_pedido(
  p_user_id uuid,
  p_itens jsonb, -- [{"product_id": "...", "quantidade": 1}, ...]
  p_cep_destino text,
  p_frete_valor numeric,
  p_frete_nome text,
  p_minutos integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_subtotal numeric := 0;
  v_item record;
  v_preco numeric;
  v_ativo boolean;
  v_disponivel integer;
begin
  if not exists (select 1 from jsonb_array_elements(p_itens)) then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer)
  loop
    select preco, ativo into v_preco, v_ativo from public.products where id = v_item.product_id for update;
    if not found or not v_ativo then
      raise exception 'Produto % não encontrado ou indisponível', v_item.product_id;
    end if;
    v_subtotal := v_subtotal + (v_preco * v_item.quantidade);
  end loop;

  insert into public.orders (id, user_id, status, subtotal, frete_valor, total, cep_destino, endereco_json, reserved_until)
  values (
    v_order_id, p_user_id, 'pending_payment', v_subtotal, p_frete_valor, v_subtotal + p_frete_valor,
    p_cep_destino, jsonb_build_object('cep', p_cep_destino, 'frete_nome', p_frete_nome),
    now() + (p_minutos || ' minutes')::interval
  );

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer)
  loop
    select preco into v_preco from public.products where id = v_item.product_id;

    insert into public.order_items (order_id, product_id, quantidade, preco_unitario)
    values (v_order_id, v_item.product_id, v_item.quantidade, v_preco);

    select stock into v_disponivel from public.products where id = v_item.product_id for update;
    select v_disponivel - coalesce(sum(quantidade), 0) into v_disponivel
      from public.stock_reservations where product_id = v_item.product_id;

    if v_disponivel < v_item.quantidade then
      raise exception 'Estoque insuficiente para o produto %', v_item.product_id;
    end if;

    insert into public.stock_reservations (order_id, product_id, quantidade, expires_at)
    values (v_order_id, v_item.product_id, v_item.quantidade, now() + (p_minutos || ' minutes')::interval);
  end loop;

  return v_order_id;
end;
$$;

-- Expira pedidos não pagos cuja reserva venceu, e libera o estoque reservado.
create or replace function public.expirar_reservas_vencidas()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders set status = 'expired'
    where status = 'pending_payment'
    and id in (select order_id from public.stock_reservations where expires_at < now());

  delete from public.stock_reservations where expires_at < now();
end;
$$;

select cron.schedule('expirar-reservas-estoque', '*/2 * * * *', $$select public.expirar_reservas_vencidas()$$);
