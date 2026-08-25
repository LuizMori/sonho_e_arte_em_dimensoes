# Migrações SQL do Supabase

Os arquivos em `migrations/` devem ser aplicados em ordem no projeto Supabase, colando o conteúdo de cada
um no **SQL Editor** do painel do Supabase (Database > SQL Editor > New query) e executando.

Não estamos usando a Supabase CLI/linked project neste momento — os arquivos aqui servem como histórico e
fonte da verdade do schema, aplicados manualmente. Se o projeto crescer, migrar para `supabase db push`
com a CLI é uma opção futura.

## Ordem de aplicação

1. `0001_profiles.sql` — tabela `profiles`, trigger de criação automática e RLS por papel (customer/admin).
2. `0002_products.sql` — tabelas `products`/`product_images` e policies de Storage. Antes ou depois de
   rodar este arquivo, crie o bucket `product-images` em Storage > New bucket, marcado como **público**
   (leitura pública das fotos dos produtos).
3. `0003_products_categoria.sql` — adiciona `categoria` e `destaque` a `products` (a página de Portfólio
   passou a ser 100% alimentada pelos produtos cadastrados pelo admin, sem dados fixos).
4. `0004_orders.sql` — tabelas `orders`/`order_items`/`stock_reservations`, função `criar_pedido`
   (cria o pedido e reserva o estoque de forma atômica) e `expirar_reservas_vencidas`, agendada via
   `pg_cron` para rodar a cada 2 minutos. **Pré-requisito:** a extensão `pg_cron` precisa estar habilitada
   em Database > Extensions antes de rodar este arquivo.
5. `0005_pagamento.sql` — função `confirmar_pagamento_pedido`, chamada só pelo webhook do Mercado Pago:
   decrementa o estoque de verdade, libera a reserva e marca o pedido como pago (idempotente).

Depois de rodar a migração 1 e o dono da loja se cadastrar pelo fluxo normal (`/cadastro`), promova a
conta a admin rodando no SQL Editor:

```sql
update public.profiles set role = 'admin' where id = '<uuid-do-usuário>';
```

O uuid é encontrado em Authentication > Users no painel do Supabase.
