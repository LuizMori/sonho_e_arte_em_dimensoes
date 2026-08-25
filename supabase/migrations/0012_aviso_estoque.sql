-- Fase pós-lançamento: aviso por e-mail quando um produto sem estoque é reabastecido.
-- Rode este arquivo inteiro no SQL Editor do Supabase. Sem pré-requisito manual.

create table public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  email text not null,
  notificado boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.stock_notifications(product_id);

-- Impede pedido de aviso duplicado enquanto ainda está pendente, mas permite pedir de novo
-- numa reposição futura, depois que "notificado" virar true.
create unique index stock_notifications_pendente_unico
  on public.stock_notifications(product_id, email)
  where notificado = false;

alter table public.stock_notifications enable row level security;

create policy "stock_notifications_insert_publico" on public.stock_notifications
  for insert with check (notificado = false);

create policy "stock_notifications_select_admin" on public.stock_notifications
  for select using (public.is_admin());
