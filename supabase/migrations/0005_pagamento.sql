-- Fase 5: confirmação de pagamento via Mercado Pago.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0001-0004.

-- Confirma o pagamento de um pedido de forma atômica: decrementa o estoque de verdade,
-- libera a reserva e marca o pedido como pago. Idempotente — se o pedido não estiver mais
-- em 'pending_payment' (já pago, cancelado ou expirado), não faz nada. Só é chamada pelo
-- webhook do Mercado Pago (via service role), nunca pelo cliente.
create or replace function public.confirmar_pagamento_pedido(p_order_id uuid, p_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
begin
  if not exists (select 1 from public.orders where id = p_order_id and status = 'pending_payment') then
    return;
  end if;

  for v_item in select product_id, quantidade from public.order_items where order_id = p_order_id
  loop
    update public.products set stock = stock - v_item.quantidade where id = v_item.product_id;
  end loop;

  delete from public.stock_reservations where order_id = p_order_id;

  update public.orders set status = 'paid', mp_payment_id = p_payment_id where id = p_order_id;
end;
$$;
