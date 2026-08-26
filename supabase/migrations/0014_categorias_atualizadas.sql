-- Atualiza o conjunto de categorias do portfólio: remove "miniaturas", renomeia
-- "colecionaveis" para "papelaria" e adiciona "educativos", "religiosos" e "presentes".
-- Produtos hoje em "miniaturas" são reclassificados como "decoracao" (não há como saber
-- automaticamente a categoria correta; o admin pode reatribuir manualmente depois).

alter table public.products drop constraint products_categoria_check;

update public.products set categoria = 'decoracao' where categoria = 'miniaturas';
update public.products set categoria = 'papelaria' where categoria = 'colecionaveis';

alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao', 'educativos', 'papelaria', 'religiosos', 'geek', 'presentes', 'personalizados'));
