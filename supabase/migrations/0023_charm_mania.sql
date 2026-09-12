-- Charm Mania: peça personalizável (letras + pingentes + caixinha opcional) — colar,
-- chaveiro, pingente de mochila etc., dependendo de como a cliente monta.
-- O produto "Charm Mania" cadastrado normalmente em /admin/produtos (categoria nova
-- "charm-mania") já representa a peça-base (cordão + ponteira): preco = valor base,
-- stock = estoque de cordão/ponteira. A caixinha é outro produto normal, mas oculto
-- do catálogo público (exibir_catalogo = false) e semeado aqui com slug fixo
-- "charm-mania-caixinha", usado pelo código para buscá-la diretamente.

alter table public.products drop constraint products_categoria_check;
alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao','educativos','papelaria','religiosos','geek','presentes','sazonais','utilidades','charm-mania'));

alter table public.products add column exibir_catalogo boolean not null default true;
alter table public.products add column valor_letra numeric(10,2);

-- Catálogo de pingentes, editável pelo admin em /admin/pingentes.
create table public.charms (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  preco numeric(10,2) not null check (preco >= 0),
  estoque integer not null default 0 check (estoque >= 0),
  imagem_url text,
  created_at timestamptz not null default now()
);

alter table public.charms enable row level security;
create policy "charms_select_all" on public.charms for select using (true);
create policy "charms_insert_admin" on public.charms for insert with check (public.is_admin());
create policy "charms_update_admin" on public.charms for update using (public.is_admin());
create policy "charms_delete_admin" on public.charms for delete using (public.is_admin());

-- Reserva de estoque de pingentes, mesmo padrão de stock_reservations (0004_orders.sql):
-- reservado na criação do pedido, decrementado de verdade na confirmação do pagamento.
create table public.charm_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  charm_id uuid not null references public.charms(id),
  quantidade integer not null check (quantidade > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index on public.charm_reservations(expires_at);
create index on public.charm_reservations(order_id);
create index on public.charm_reservations(charm_id);

alter table public.charm_reservations enable row level security;
-- sem policy de acesso direto do cliente: uso interno das funções security definer abaixo,
-- mesmo padrão de stock_reservations.

-- Snapshot da personalização escolhida (sequência de letras/pingentes, caixinha, preços
-- já resolvidos no momento da compra) — mesmo espírito de order_items.cor/variacao, mas
-- como a Charm Mania é uma composição de várias partes, precisa de uma estrutura, não só texto.
alter table public.order_items add column personalizacao jsonb;

-- Produto "Caixinha Charm Mania": oculto do catálogo público, preço/estoque reais a
-- preencher pelo admin depois de rodar esta migration (começa com preco=0, stock=0).
insert into public.products
  (nome, descricao, preco, categoria, peso_g, altura_cm, largura_cm, comprimento_cm, stock, ativo, destaque, slug, exibir_catalogo)
values
  ('Caixinha Charm Mania', 'Caixinha opcional para presentear a peça Charm Mania.', 0, 'charm-mania', 20, 5, 5, 5, 0, true, false, 'charm-mania-caixinha', false);

-- Reescreve criar_pedido (mesmo corpo de 0018_variacoes_produto.sql como base) para aceitar
-- um campo novo opcional por item, "personalizacao", com a sequência de contas (letras e
-- pingentes) e se a caixinha foi incluída. Quando presente, o preço do item deixa de ser só
-- o preco do produto: passa a ser base + (nº de letras × valor_letra) + soma dos pingentes
-- + caixinha (se incluída) — tudo recalculado aqui, nunca confiando no valor mandado pelo
-- client. A sequência gravada em order_items.personalizacao sai enriquecida (nome/preço de
-- cada pingente já resolvidos), virando um snapshot histórico fiel à compra.
create or replace function public.criar_pedido(
  p_user_id uuid,
  p_itens jsonb, -- [{"product_id": "...", "quantidade": 1, "cor": null, "variacao": null, "personalizacao": {"sequencia": [...], "caixinha": true} | null}, ...]
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
  v_item_preco numeric;
  v_base numeric;
  v_valor_letra numeric;
  v_conta jsonb;
  v_letras integer;
  v_sequencia_final jsonb;
  v_charm_id uuid;
  v_charm_nome text;
  v_charm_preco numeric;
  v_charm_estoque numeric;
  v_charm_qtds jsonb;
  v_caixinha_id uuid;
  v_caixinha_preco numeric;
  v_caixinha_nome text;
  v_caixinha_stock integer;
  v_caixinha_info jsonb;
  v_chave text;
  v_qtd integer;
begin
  if not exists (select 1 from jsonb_array_elements(p_itens)) then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  -- Passo 1: valida cada produto-base e acumula o subtotal (já considerando a
  -- personalização da Charm Mania, quando houver).
  for v_item in select * from jsonb_to_recordset(p_itens)
    as x(product_id uuid, quantidade integer, cor text, variacao text, personalizacao jsonb)
  loop
    select preco, ativo into v_preco, v_ativo from public.products where id = v_item.product_id for update;
    if not found or not v_ativo then
      raise exception 'Produto % não encontrado ou indisponível', v_item.product_id;
    end if;

    v_item_preco := v_preco;

    if v_item.personalizacao is not null then
      v_letras := 0;
      for v_conta in select * from jsonb_array_elements(v_item.personalizacao->'sequencia')
      loop
        if v_conta->>'tipo' = 'letra' then
          v_letras := v_letras + 1;
        elsif v_conta->>'tipo' = 'pingente' then
          select preco into v_charm_preco from public.charms where id = (v_conta->>'charmId')::uuid;
          if not found then
            raise exception 'Pingente % não encontrado', v_conta->>'charmId';
          end if;
          v_item_preco := v_item_preco + v_charm_preco;
        end if;
      end loop;

      select valor_letra into v_valor_letra from public.products where id = v_item.product_id;
      v_item_preco := v_item_preco + (v_letras * coalesce(v_valor_letra, 0));

      if (v_item.personalizacao->>'caixinha')::boolean then
        select id, preco into v_caixinha_id, v_caixinha_preco
          from public.products where slug = 'charm-mania-caixinha';
        if v_caixinha_id is null then
          raise exception 'Caixinha da Charm Mania não está cadastrada';
        end if;
        v_item_preco := v_item_preco + v_caixinha_preco;
      end if;
    end if;

    v_subtotal := v_subtotal + (v_item_preco * v_item.quantidade);
  end loop;

  insert into public.orders (id, user_id, status, subtotal, frete_valor, total, cep_destino, telefone, endereco_json, reserved_until)
  values (
    v_order_id, p_user_id, 'pending_payment', v_subtotal, p_frete_valor, v_subtotal + p_frete_valor,
    p_cep_destino, p_telefone,
    p_endereco || jsonb_build_object('cep', p_cep_destino, 'frete_nome', p_frete_nome),
    now() + (p_minutos || ' minutes')::interval
  );

  -- Passo 2: insere os itens do pedido e reserva o estoque (produto-base, pingentes e
  -- caixinha, quando aplicável).
  for v_item in select * from jsonb_to_recordset(p_itens)
    as x(product_id uuid, quantidade integer, cor text, variacao text, personalizacao jsonb)
  loop
    select preco, nome into v_base, v_nome from public.products where id = v_item.product_id;
    v_item_preco := v_base;
    v_sequencia_final := '[]'::jsonb;
    v_charm_qtds := '{}'::jsonb;
    v_caixinha_info := null;

    if v_item.personalizacao is not null then
      v_letras := 0;

      for v_conta in select * from jsonb_array_elements(v_item.personalizacao->'sequencia')
      loop
        if v_conta->>'tipo' = 'letra' then
          v_letras := v_letras + 1;
          v_sequencia_final := v_sequencia_final || jsonb_build_array(v_conta);
        elsif v_conta->>'tipo' = 'pingente' then
          v_charm_id := (v_conta->>'charmId')::uuid;
          select nome, preco into v_charm_nome, v_charm_preco from public.charms where id = v_charm_id;
          v_sequencia_final := v_sequencia_final || jsonb_build_array(
            jsonb_build_object('tipo', 'pingente', 'charmId', v_charm_id, 'nome', v_charm_nome, 'preco', v_charm_preco)
          );
          v_chave := v_charm_id::text;
          v_qtd := coalesce((v_charm_qtds->>v_chave)::integer, 0) + v_item.quantidade;
          v_charm_qtds := jsonb_set(v_charm_qtds, array[v_chave], to_jsonb(v_qtd));
        end if;
      end loop;

      select valor_letra into v_valor_letra from public.products where id = v_item.product_id;
      v_item_preco := v_item_preco + (v_letras * coalesce(v_valor_letra, 0));

      if (v_item.personalizacao->>'caixinha')::boolean then
        select id, nome, preco, stock into v_caixinha_id, v_caixinha_nome, v_caixinha_preco, v_caixinha_stock
          from public.products where slug = 'charm-mania-caixinha' for update;
        v_item_preco := v_item_preco + v_caixinha_preco;
        v_caixinha_info := jsonb_build_object('incluida', true, 'nome', v_caixinha_nome, 'preco', v_caixinha_preco);

        select v_caixinha_stock - coalesce(sum(quantidade), 0) into v_disponivel
          from public.stock_reservations where product_id = v_caixinha_id;
        if v_disponivel < v_item.quantidade then
          raise exception 'Estoque insuficiente para a caixinha da Charm Mania';
        end if;

        insert into public.stock_reservations (order_id, product_id, quantidade, expires_at)
        values (v_order_id, v_caixinha_id, v_item.quantidade, now() + (p_minutos || ' minutes')::interval);
      end if;
    end if;

    insert into public.order_items (order_id, product_id, quantidade, preco_unitario, nome_produto, cor, variacao, personalizacao)
    values (
      v_order_id, v_item.product_id, v_item.quantidade, v_item_preco, v_nome, v_item.cor, v_item.variacao,
      case when v_item.personalizacao is null then null else jsonb_build_object(
        'sequencia', v_sequencia_final,
        'caixinha', coalesce(v_caixinha_info, jsonb_build_object('incluida', false)),
        'valor_base', v_base,
        'total', v_item_preco
      ) end
    );

    -- Reserva do produto-base (cordão/ponteira da Charm Mania, ou produto normal).
    select stock into v_disponivel from public.products where id = v_item.product_id for update;
    select v_disponivel - coalesce(sum(quantidade), 0) into v_disponivel
      from public.stock_reservations where product_id = v_item.product_id;

    if v_disponivel < v_item.quantidade then
      raise exception 'Estoque insuficiente para o produto %', v_item.product_id;
    end if;

    insert into public.stock_reservations (order_id, product_id, quantidade, expires_at)
    values (v_order_id, v_item.product_id, v_item.quantidade, now() + (p_minutos || ' minutes')::interval);

    -- Reserva de cada pingente usado na sequência (agregado por charm_id).
    for v_chave, v_qtd in select key, value::integer from jsonb_each_text(v_charm_qtds)
    loop
      select estoque into v_charm_estoque from public.charms where id = v_chave::uuid for update;
      select v_charm_estoque - coalesce(sum(quantidade), 0) into v_charm_estoque
        from public.charm_reservations where charm_id = v_chave::uuid;

      if v_charm_estoque < v_qtd then
        raise exception 'Estoque insuficiente para o pingente %', v_chave;
      end if;

      insert into public.charm_reservations (order_id, charm_id, quantidade, expires_at)
      values (v_order_id, v_chave::uuid, v_qtd, now() + (p_minutos || ' minutes')::interval);
    end loop;
  end loop;

  return v_order_id;
end;
$$;

-- confirmar_pagamento_pedido (0005_pagamento.sql) ganha a baixa real do estoque de
-- pingentes, mesma lógica já usada pra products.stock, agregando charm_reservations por
-- pedido antes de decrementar charms.estoque.
create or replace function public.confirmar_pagamento_pedido(p_order_id uuid, p_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_charm record;
begin
  if not exists (select 1 from public.orders where id = p_order_id and status = 'pending_payment') then
    return;
  end if;

  for v_item in select product_id, quantidade from public.order_items where order_id = p_order_id
  loop
    update public.products set stock = stock - v_item.quantidade where id = v_item.product_id;
  end loop;

  for v_charm in
    select charm_id, sum(quantidade) as quantidade
    from public.charm_reservations
    where order_id = p_order_id
    group by charm_id
  loop
    update public.charms set estoque = estoque - v_charm.quantidade where id = v_charm.charm_id;
  end loop;

  delete from public.stock_reservations where order_id = p_order_id;
  delete from public.charm_reservations where order_id = p_order_id;

  update public.orders set status = 'paid', mp_payment_id = p_payment_id where id = p_order_id;
end;
$$;

-- expirar_reservas_vencidas (0004_orders.sql) também precisa liberar charm_reservations
-- vencidas, senão o estoque de pingente fica preso indefinidamente em pedidos abandonados.
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
  delete from public.charm_reservations where expires_at < now();
end;
$$;
