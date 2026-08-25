-- Depoimentos de clientes: texto+nota enviado pelo público (fica pendente) ou print publicado pelo admin.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0005_pagamento.sql.
-- Pré-requisito: crie o bucket "testimonial-images" em Storage (com leitura pública) antes ou depois
-- de rodar este arquivo — a ordem não importa para as policies abaixo.

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('texto', 'print')),
  nome_cliente text not null,
  texto text,
  nota integer check (nota between 1 and 5),
  imagem_url text,
  aprovado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

-- Público só vê depoimentos aprovados; admin vê tudo (inclusive pendentes, para moderar).
create policy "testimonials_select_aprovados" on public.testimonials
  for select using (aprovado = true or public.is_admin());

-- Visitante (autenticado ou não) só pode inserir um depoimento de texto, pendente, sem imagem —
-- não consegue se auto-aprovar nem inserir um "print" mesmo manipulando o request.
create policy "testimonials_insert_publico" on public.testimonials
  for insert with check (tipo = 'texto' and aprovado = false and imagem_url is null);

-- Admin pode inserir qualquer linha (ex: print já aprovado).
create policy "testimonials_insert_admin" on public.testimonials
  for insert with check (public.is_admin());

create policy "testimonials_update_admin" on public.testimonials
  for update using (public.is_admin());

create policy "testimonials_delete_admin" on public.testimonials
  for delete using (public.is_admin());

-- Storage: bucket "testimonial-images" precisa existir (Storage > New bucket, marcado como público).
-- Leitura pública já é resolvida pelo bucket público; aqui só liberamos escrita para o admin.
create policy "testimonial_images_storage_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'testimonial-images' and public.is_admin());

create policy "testimonial_images_storage_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'testimonial-images' and public.is_admin());
