-- CRITICO: a policy "profiles_update_own" (0001_profiles.sql) só verifica
-- auth.uid() = id, sem "with check" restringindo quais colunas podem mudar. Isso permite
-- que qualquer usuário autenticado faça um PATCH direto em /rest/v1/profiles?id=eq.<seu-id>
-- (com a chave anon publica + seu proprio JWT, sem passar por nenhuma funcao serverless) e
-- troque role de 'customer' para 'admin' — liberando todas as policies is_admin() do banco
-- (ver pedidos de todo mundo, gerenciar produtos, etc).
--
-- Correção via trigger (em vez de embutir a checagem na policy) porque também cobre a
-- policy "profiles_update_admin" e qualquer futura policy de update sobre profiles: ninguém
-- que não seja admin consegue mudar a própria role, não importa qual policy autorizou o
-- update em si.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Não é permitido alterar o próprio nível de acesso';
  end if;
  return new;
end;
$$;

create trigger prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();
