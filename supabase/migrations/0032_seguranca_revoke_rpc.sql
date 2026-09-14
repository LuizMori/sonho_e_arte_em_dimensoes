-- CRITICO: nenhuma migration deste projeto jamais revogou o EXECUTE padrão que o Postgres/
-- Supabase concede a PUBLIC (e por herança, anon/authenticated) em funções novas. Isso foi
-- confirmado ao vivo: uma chamada anônima (sem login, só com a anon key) para
-- /rest/v1/rpc/confirmar_pagamento_pedido com um order_id qualquer é aceita (HTTP 204) em vez
-- de barrada por falta de permissão.
--
-- confirmar_pagamento_pedido é security definer, não confere dono do pedido nem valida o
-- payment_id contra o Mercado Pago — ela confia inteiramente em quem a chama já ter feito essa
-- validação (o webhook e o sync-payment fazem isso antes de chamá-la, mas a função em si, se
-- exposta, pode ser chamada direto por qualquer cliente com qualquer order_id pendente,
-- marcando o pedido como pago e baixando estoque sem nenhum pagamento real).
--
-- criar_pedido tem o mesmo problema por um ângulo diferente: recebe p_user_id como parâmetro
-- cru em vez de derivar de auth.uid(), então exposta via RPC permite criar pedidos em nome de
-- outro usuário. As duas únicas chamadoras legítimas (api/orders/create.ts e
-- api/mercadopago/{webhook,sync-payment}.ts) sempre usam a service_role key, que já ignora
-- RLS e concessões de anon/authenticated — revogar destes dois papéis não quebra nada real.
revoke execute on function public.criar_pedido(
  uuid, jsonb, text, numeric, text, text, jsonb, integer
) from public, anon, authenticated;

revoke execute on function public.confirmar_pagamento_pedido(uuid, text) from public, anon, authenticated;

-- Limpeza: a assinatura de 6 parâmetros de criar_pedido usada em 0004_orders.sql e
-- 0008_produto_delete.sql (antes de p_telefone/p_endereco existirem) tem um número de
-- argumentos diferente da versão atual de 8 parâmetros — "create or replace function" só
-- substitui quando a assinatura bate exatamente, então essa versão antiga pode ter ficado
-- órfã no banco (ainda com o EXECUTE padrão liberado, e sem nenhuma das validações
-- adicionadas depois). Removida por segurança; nenhum código do projeto chama essa
-- assinatura antiga.
drop function if exists public.criar_pedido(uuid, jsonb, text, numeric, text, integer);
