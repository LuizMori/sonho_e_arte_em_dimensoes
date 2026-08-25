-- Fase 1: perfis de usuário vinculados a auth.users, com papel (customer/admin) e RLS.
-- Rode este arquivo inteiro no SQL Editor do Supabase (Database > SQL Editor > New query).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Cria automaticamente um perfil "customer" quando um novo usuário se cadastra no Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Função auxiliar para checar se o usuário logado é admin, usada nas policies abaixo.
-- É "security definer" para não recair em recursão de RLS ao consultar a própria tabela profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- Sem policy de INSERT/DELETE para o client: perfis só são criados pela trigger acima
-- (security definer) e não devem ser deletados diretamente pelo app.
