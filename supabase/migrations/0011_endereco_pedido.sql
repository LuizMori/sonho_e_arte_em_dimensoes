-- Coleta endereço completo e telefone no checkout (antes só o CEP era pedido).
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0010_profiles_email.sql.

alter table public.orders add column telefone text;

-- Reescreve criar_pedido (mesmo corpo de 0004/0008) só para incluir telefone e o endereço completo.
-- p_telefone e p_endereco têm default para não quebrar a chamada antiga enquanto o deploy não sobe
-- (a RPC é chamada com parâmetros nomeados, então os defaults cobrem essa janela).
create or replace function public.criar_pedido(
  p_user_id uuid,
  p_itens jsonb, -- [{"product_id": "...", "quantidade": 1}, ...]
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

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer)
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

  for v_item in select * from jsonb_to_recordset(p_itens) as x(product_id uuid, quantidade integer)
  loop
    select preco, nome into v_preco, v_nome from public.products where id = v_item.product_id;

    insert into public.order_items (order_id, product_id, quantidade, preco_unitario, nome_produto)
    values (v_order_id, v_item.product_id, v_item.quantidade, v_preco, v_nome);

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
