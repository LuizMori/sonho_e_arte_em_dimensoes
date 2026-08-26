-- Fase pós-lançamento: rótulo de tamanho livre e amigável ao cliente, separado das medidas
-- reais usadas para cotar frete. Rode este arquivo inteiro no SQL Editor do Supabase.

alter table public.products add column tamanho_exibicao text;
