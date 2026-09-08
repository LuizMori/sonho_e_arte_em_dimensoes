-- Adiciona "Utilidades" como categoria atribuível a produtos.

alter table public.products drop constraint products_categoria_check;

alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao', 'educativos', 'papelaria', 'religiosos', 'geek', 'presentes', 'sazonais', 'utilidades'));
