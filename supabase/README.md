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
6. `0006_depoimentos.sql` — tabela `testimonials` (depoimentos de clientes com nota, ou prints de feedback
   publicados pelo admin) e RLS que só libera leitura pública para linhas aprovadas. Antes ou depois de
   rodar este arquivo, crie o bucket `testimonial-images` em Storage > New bucket, marcado como
   **público**.
7. `0007_visitas.sql` — tabela `page_views`, um contador de visitas próprio (sem serviço externo):
   qualquer visitante pode registrar uma visualização, só o admin pode ler os dados. Sem pré-requisito
   manual.
8. `0008_produto_delete.sql` — corrige a exclusão de produtos que já foram comprados (antes bloqueada por
   violação de FK em `order_items`). Adiciona `nome_produto` como snapshot em `order_items` (mesmo padrão
   de `preco_unitario`) e ajusta a FK para `on delete set null`, preservando o histórico de pedidos mesmo
   depois do produto ser excluído do catálogo.
9. `0009_categoria_geek.sql` — adiciona a categoria `geek` ao check constraint de `products.categoria`.
10. `0010_profiles_email.sql` — adiciona `email` a `profiles` (snapshot de `auth.users.email`, atualizado
    pela trigger de cadastro), usado pela tela `/admin/usuarios` para listar nome + e-mail sem precisar
    de uma função serverless com a service role key.
11. `0011_endereco_pedido.sql` — adiciona `telefone` a `orders` e reescreve `criar_pedido` para receber
    o endereço completo (mesclado em `endereco_json`) e o telefone de contato, com defaults para não
    quebrar a chamada antiga durante a janela entre migration e deploy.
12. `0012_aviso_estoque.sql` — tabela `stock_notifications`: cliente pede para ser avisado por e-mail
    quando um produto sem estoque for reabastecido. Inserção pública, leitura só do admin; índice único
    parcial evita pedido duplicado enquanto o aviso ainda está pendente. Sem pré-requisito manual.
13. `0013_tamanho_exibicao.sql` — adiciona `tamanho_exibicao` (texto livre, opcional) a `products`: rótulo
    amigável mostrado ao cliente no lugar da dimensão em cm (ex: "Tamanho único"), sem afetar os campos
    numéricos usados para cotar frete. Sem pré-requisito manual.
14. `0014_categorias_atualizadas.sql` — atualiza as categorias do portfólio: remove `miniaturas`
    (produtos existentes viram `decoracao`), renomeia `colecionaveis` para `papelaria` e adiciona
    `educativos`, `religiosos` e `presentes`. Sem pré-requisito manual.
15. `0015_galeria_personalizados.sql` — tabela `custom_gallery`: fotos (com descrição opcional) de
    peças personalizadas já realizadas, mostradas na categoria "Personalizados" do Portfólio. Leitura
    pública, escrita só do admin. Antes ou depois de rodar este arquivo, crie o bucket `custom-gallery`
    em Storage > New bucket, marcado como **público**.
16. `0016_remove_categoria_personalizados.sql` — remove `personalizados` do check constraint de
    `products.categoria`: essa aba do Portfólio passa a ser só informativa (sugestões + galeria),
    nenhum produto pode mais ser cadastrado nela. Produtos que ainda estivessem em `personalizados`
    viram `decoracao`. Sem pré-requisito manual.

Depois de rodar a migração 1 e o dono da loja se cadastrar pelo fluxo normal (`/cadastro`), promova a
conta a admin rodando no SQL Editor:

```sql
update public.profiles set role = 'admin' where id = '<uuid-do-usuário>';
```

O uuid é encontrado em Authentication > Users no painel do Supabase.
