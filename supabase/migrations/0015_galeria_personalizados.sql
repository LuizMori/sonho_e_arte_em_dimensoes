-- Galeria de fotos de peças personalizadas já realizadas, mostrada na categoria
-- "Personalizados" do Portfólio. Não é um produto (sem preço/estoque/frete), só uma
-- foto + descrição opcional, gerenciada pelo admin.

create table public.custom_gallery (
  id uuid primary key default gen_random_uuid(),
  imagem_url text not null,
  descricao text,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_gallery enable row level security;

create policy "custom_gallery_select_publico" on public.custom_gallery
  for select using (true);

create policy "custom_gallery_insert_admin" on public.custom_gallery
  for insert with check (public.is_admin());

create policy "custom_gallery_update_admin" on public.custom_gallery
  for update using (public.is_admin());

create policy "custom_gallery_delete_admin" on public.custom_gallery
  for delete using (public.is_admin());

-- Storage: bucket "custom-gallery" precisa existir (Storage > New bucket, público) antes de usar.
create policy "custom_gallery_storage_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'custom-gallery' and public.is_admin());

create policy "custom_gallery_storage_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'custom-gallery' and public.is_admin());
