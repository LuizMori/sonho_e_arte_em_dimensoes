-- Fase 2b: une o catálogo de produtos com a página de Portfólio.
-- Adiciona categoria (mesmos slugs usados hoje em src/data/categorias.ts) e destaque (usado na Home).

alter table public.products
  add column categoria text not null default 'decoracao'
    check (categoria in ('decoracao', 'personalizados', 'miniaturas', 'colecionaveis')),
  add column destaque boolean not null default false;
