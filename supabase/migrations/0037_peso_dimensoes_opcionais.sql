-- Peso e dimensões passam a ser opcionais no produto: em branco, não aparecem nos detalhes
-- da página do produto. Os checks "> 0" continuam valendo quando há valor (um check com
-- NULL passa). O frete de produto sem medidas usa uma embalagem padrão (api/), já que o
-- Melhor Envio exige peso e dimensões pra cotar.
alter table public.products alter column peso_g drop not null;
alter table public.products alter column altura_cm drop not null;
alter table public.products alter column largura_cm drop not null;
alter table public.products alter column comprimento_cm drop not null;
