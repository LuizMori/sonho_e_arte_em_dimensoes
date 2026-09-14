-- Rate limit para os formulários públicos de contato e orçamento (api/contato.ts,
-- api/orcamento.ts): são endpoints não autenticados, sem captcha, então sem isso qualquer
-- um pode automatizar chamadas e usar a caixa de CONTACT_EMAIL pra spam/mail-bomb, ou (no
-- caso do orçamento) gastar a cota de envio de e-mail do Resend com anexos.
--
-- Cada linha é uma tentativa registrada por IP + endpoint; a janela de tempo é aplicada no
-- código (api/), que conta linhas recentes antes de decidir se bloqueia. Sem policy de
-- select/insert pra ninguém: só a service role (usada pelas duas funções serverless) mexe
-- nessa tabela, então RLS habilitado sem nenhuma policy já nega tudo pra anon/authenticated.
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  chave text not null, -- ex: "contato:203.0.113.5"
  created_at timestamptz not null default now()
);

create index on public.rate_limits(chave, created_at);

alter table public.rate_limits enable row level security;
