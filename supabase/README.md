# Migrações SQL do Supabase

Os arquivos em `migrations/` devem ser aplicados em ordem no projeto Supabase, colando o conteúdo de cada
um no **SQL Editor** do painel do Supabase (Database > SQL Editor > New query) e executando.

Não estamos usando a Supabase CLI/linked project neste momento — os arquivos aqui servem como histórico e
fonte da verdade do schema, aplicados manualmente. Se o projeto crescer, migrar para `supabase db push`
com a CLI é uma opção futura.

## Ordem de aplicação

1. `0001_profiles.sql` — tabela `profiles`, trigger de criação automática e RLS por papel (customer/admin).

Depois de rodar a migração 1 e o dono da loja se cadastrar pelo fluxo normal (`/cadastro`), promova a
conta a admin rodando no SQL Editor:

```sql
update public.profiles set role = 'admin' where id = '<uuid-do-usuário>';
```

O uuid é encontrado em Authentication > Users no painel do Supabase.
