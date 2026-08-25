-- Guarda o e-mail em profiles (snapshot de auth.users.email) para o admin poder listar usuários
-- sem precisar de uma função serverless com a service role key só para isso.
-- Rode este arquivo inteiro no SQL Editor do Supabase, depois de 0009_categoria_geek.sql.

alter table public.profiles add column email text;

update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is null;

-- Atualiza a trigger de criação de perfil para gravar o e-mail junto com o nome.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, new.raw_user_meta_data->>'nome', new.email);
  return new;
end;
$$;
