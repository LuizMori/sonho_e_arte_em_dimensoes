-- Variações por produto (ex: um produto "Boneca Princesa" com 15 personagens): diferente
-- de cor, não é uma paleta global — cada produto define sua própria lista de nomes livres.
-- Estoque continua sendo um só por produto (soma de todas as variações), sem controle
-- individual por variação. A variação escolhida é gravada como snapshot em
-- order_items.variacao, mesmo padrão já usado para cor/nome_produto/preco_unitario.

create table public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index on public.product_variations(product_id);

alter table public.product_variations enable row level security;

create policy "product_variations_select_all" on public.product_variations for select using (true);
create policy "product_variations_insert_admin" on public.product_variations for insert with check (public.is_admin());
create policy "product_variations_delete_admin" on public.product_variations for delete using (public.is_admin());

alter table public.order_items add column variacao text;

-- Reescreve criar_pedido (mesmo corpo de 0017_cores_produto.sql) só para ler "variacao" de
-- dentro de cada item de p_itens e gravar em order_items.variacao.
create or replace function public.criar_pedido(
  p_user_id uuid,
  p_itens jsonb, -- [{"product_id": "...", "quantidade": 1, "cor": "Azul claro", "variacao": "Elsa"}, ...]
  p_cep_destino text,
  p_frete_valor numeric,
  p_frete_nome text,
  p_telefone text default '',
  p_endereco jsonb default '{}'::jsonb,
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
  v_nome text;
  v_ativo boolean;
  v_disponivel integer;
begin
  if not exists (select 1 from jsonb_array_elements(p_itens)) then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer, cor text, variacao text)
  loop
    select preco, ativo into v_preco, v_ativo from public.products where id = v_item.product_id for update;
    if not found or not v_ativo then
      raise exception 'Produto % não encontrado ou indisponível', v_item.product_id;
    end if;
    v_subtotal := v_subtotal + (v_preco * v_item.quantidade);
  end loop;

  insert into public.orders (id, user_id, status, subtotal, frete_valor, total, cep_destino, telefone, endereco_json, reserved_until)
  values (
    v_order_id, p_user_id, 'pending_payment', v_subtotal, p_frete_valor, v_subtotal + p_frete_valor,
    p_cep_destino, p_telefone,
    p_endereco || jsonb_build_object('cep', p_cep_destino, 'frete_nome', p_frete_nome),
    now() + (p_minutos || ' minutes')::interval
  );

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer, cor text, variacao text)
  loop
    select preco, nome into v_preco, v_nome from public.products where id = v_item.product_id;

    insert into public.order_items (order_id, product_id, quantidade, preco_unitario, nome_produto, cor, variacao)
    values (v_order_id, v_item.product_id, v_item.quantidade, v_preco, v_nome, v_item.cor, v_item.variacao);

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
