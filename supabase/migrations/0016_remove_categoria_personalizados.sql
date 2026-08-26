-- "Personalizados" deixa de ser uma categoria atribuível a produtos: no Portfólio ela
-- agora é só uma aba informativa (sugestões de itens sob encomenda + galeria de fotos
-- de peças já feitas), sem grade de produtos. Nenhum produto deve ficar com essa
-- categoria daqui pra frente.

alter table public.products drop constraint products_categoria_check;

update public.products set categoria = 'decoracao' where categoria = 'personalizados';

alter table public.products add constraint products_categoria_check
  check (categoria in ('decoracao', 'educativos', 'papelaria', 'religiosos', 'geek', 'presentes'));
