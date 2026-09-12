-- Galeria de fotos de peças Charm Mania já feitas, mostrada na aba "Charm Mania" do
-- Portfólio (mesmo espírito de custom_gallery/0015_galeria_personalizados.sql: não é um
-- produto, só foto + descrição opcional, gerenciada pelo admin). Reaproveita o bucket
-- "product-images" já existente (prefixo "charm-mania-gallery/"), sem precisar criar bucket novo.

create table public.charm_mania_gallery (
  id uuid primary key default gen_random_uuid(),
  imagem_url text not null,
  descricao text,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.charm_mania_gallery enable row level security;

create policy "charm_mania_gallery_select_publico" on public.charm_mania_gallery
  for select using (true);

create policy "charm_mania_gallery_insert_admin" on public.charm_mania_gallery
  for insert with check (public.is_admin());

create policy "charm_mania_gallery_update_admin" on public.charm_mania_gallery
  for update using (public.is_admin());

create policy "charm_mania_gallery_delete_admin" on public.charm_mania_gallery
  for delete using (public.is_admin());
