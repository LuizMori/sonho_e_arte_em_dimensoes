-- Contador de visitas próprio: uma linha por carregamento de página pública, exibido no painel admin.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0006_depoimentos.sql.

create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id uuid not null,
  created_at timestamptz not null default now()
);

create index on public.page_views(created_at);

alter table public.page_views enable row level security;

-- Qualquer visitante (mesmo sem login) pode registrar uma visualização de página.
create policy "page_views_insert_publico" on public.page_views
  for insert with check (true);

-- Só o admin pode ler os dados de tráfego (padrões de acesso não ficam expostos publicamente).
create policy "page_views_select_admin" on public.page_views
  for select using (public.is_admin());
