-- Adiciona a categoria "geek" ao catálogo de produtos.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0008_produto_delete.sql.

alter table public.products drop constraint products_categoria_check;
alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao', 'personalizados', 'miniaturas', 'colecionaveis', 'geek'));
