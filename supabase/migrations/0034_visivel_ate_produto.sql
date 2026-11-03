-- Data limite opcional de exibição do produto no portfólio (ex: itens sazonais). Depois
-- dessa data (inclusive o próprio dia) o produto deixa de aparecer na listagem, busca e home,
-- mas continua cadastrado no admin com fotos e dados — basta apagar ou mudar a data pra ele
-- voltar. Filtro aplicado na hora da consulta (api/frontend), sem job agendado.
alter table public.products add column visivel_ate date;
