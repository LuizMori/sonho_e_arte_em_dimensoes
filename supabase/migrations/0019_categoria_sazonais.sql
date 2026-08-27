-- Adiciona "Sazonais" como categoria atribuível a produtos (ex: itens de datas
-- comemorativas como Natal, Páscoa, festas juninas).

alter table public.products drop constraint products_categoria_check;

alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao', 'educativos', 'papelaria', 'religiosos', 'geek', 'presentes', 'sazonais'));
