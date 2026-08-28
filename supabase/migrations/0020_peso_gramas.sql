-- Peso do produto passa a ser cadastrado e armazenado em gramas (inteiro), não mais
-- em quilogramas. A coluna é renomeada e os valores existentes (kg, ex: 0.150) são
-- convertidos para gramas (ex: 150) antes da mudança de tipo.

alter table public.products rename column peso_kg to peso_g;

alter table public.products drop constraint products_peso_kg_check;

alter table public.products
  alter column peso_g type integer using round(peso_g * 1000)::integer;

alter table public.products add constraint products_peso_g_check check (peso_g > 0);
