-- Fase 2: catálogo de produtos comprável (distinto do portfólio estático) + Storage.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0001_profiles.sql.
-- Pré-requisito: crie o bucket "product-images" em Storage (com leitura pública) antes ou depois
-- de rodar este arquivo — a ordem não importa para as policies abaixo.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  preco numeric(10,2) not null check (preco >= 0),
  peso_kg numeric(6,3) not null check (peso_kg > 0),
  altura_cm numeric(6,2) not null check (altura_cm > 0),
  largura_cm numeric(6,2) not null check (largura_cm > 0),
  comprimento_cm numeric(6,2) not null check (comprimento_cm > 0),
  stock integer not null default 0 check (stock >= 0),
  ativo boolean not null default true,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text not null default '',
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index on public.product_images(product_id);

-- Mantém updated_at em dia a cada edição.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Catálogo é público para leitura (a página da loja filtra ativo=true na query);
-- toda escrita é restrita ao admin via public.is_admin() (criada em 0001_profiles.sql).
create policy "products_select_all" on public.products for select using (true);
create policy "products_insert_admin" on public.products for insert with check (public.is_admin());
create policy "products_update_admin" on public.products for update using (public.is_admin());
create policy "products_delete_admin" on public.products for delete using (public.is_admin());

create policy "product_images_select_all" on public.product_images for select using (true);
create policy "product_images_insert_admin" on public.product_images for insert with check (public.is_admin());
create policy "product_images_update_admin" on public.product_images for update using (public.is_admin());
create policy "product_images_delete_admin" on public.product_images for delete using (public.is_admin());

-- Storage: bucket "product-images" precisa existir (Storage > New bucket, marcado como público).
-- Leitura pública já é resolvida pelo bucket público; aqui só liberamos escrita para o admin.
create policy "product_images_storage_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_storage_update_admin"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_storage_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
