# Sonho e Arte em Dimensões

Site institucional do estúdio de impressão 3D Sonho e Arte em Dimensões, construído com React, Vite e TypeScript.

## Como rodar o projeto

```bash
npm install
npm run dev
```

O projeto abre por padrão em `http://localhost:5173`.

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Deploy na Vercel

O projeto está pronto para deploy direto do repositório GitHub:

1. Importe o repositório na Vercel.
2. O framework é detectado automaticamente como Vite (build command `npm run build`, diretório de saída `dist`).
3. O arquivo [`vercel.json`](vercel.json) já configura o redirecionamento de todas as rotas para `index.html`,
   necessário porque o site usa React Router no lado do cliente (sem isso, atualizar a página em uma rota como
   `/sobre` resultaria em erro 404).

O formulário de orçamento envia e-mail de verdade através de uma função serverless (`api/orcamento.ts`) e do
serviço [Resend](https://resend.com). Para isso, configure em Vercel > Settings > Environment Variables:

- `RESEND_API_KEY`: chave de API gerada na sua conta do Resend.
- `CONTACT_EMAIL`: e-mail que deve receber os pedidos de orçamento.

Os e-mails são enviados a partir de `orcamento@sonhoearte3d.com.br`. Para isso funcionar, o domínio
`sonhoearte3d.com.br` precisa estar **verificado no Resend** (Domains > Add Domain, adicionando os registros
DNS de SPF/DKIM que o Resend fornece no painel de domínio do registrador). Sem essa verificação, o envio
falha. Veja [`.env.example`](.env.example) para mais detalhes.

O projeto está migrando de site institucional para loja. A camada de dados (auth, produtos, pedidos) usa
[Supabase](https://supabase.com) (Auth + Postgres + Storage). Para isso funcionar, configure em
Vercel > Settings > Environment Variables (e em `.env.local` para rodar localmente):

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: em Project Settings > API do seu projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: mesma tela, usada só em funções serverless que precisem ignorar RLS.

O schema do banco (tabelas, triggers, RLS) fica versionado em [`supabase/migrations`](supabase/migrations),
com instruções de como aplicar em [`supabase/README.md`](supabase/README.md).

O carrinho de compras roda no cliente (localStorage) e a cotação de frete usa a API do
[Melhor Envio](https://melhorenvio.com.br) através da função serverless `api/shipping/quote.ts` (o token
nunca fica exposto no frontend). Configure em Vercel > Settings > Environment Variables:

- `MELHOR_ENVIO_TOKEN`: token de acesso pessoal gerado no painel do Melhor Envio.
- `CEP_ORIGEM`: CEP de origem dos envios (endereço do estúdio), sem traço.
- `MELHOR_ENVIO_API_URL` (opcional): use a URL de sandbox durante testes.

O pagamento é feito via [Mercado Pago](https://www.mercadopago.com.br) (Checkout Pro). A confirmação do
pedido como pago **só acontece pelo webhook** (`api/mercadopago/webhook.ts`), que valida a assinatura da
notificação e sempre reconsulta a Payment API antes de confiar no status — nunca pelo retorno do cliente
ao site. Configure em Vercel > Settings > Environment Variables:

- `MP_ACCESS_TOKEN`: access token gerado em Suas integrações > Credenciais no painel do Mercado Pago.
  Use um token de teste (`TEST-...`) para testar sem cobrar de verdade.
- `MP_WEBHOOK_SECRET`: assinatura secreta configurada em Suas integrações > Webhooks.

Depois de configurar as credenciais, cadastre a URL do webhook no painel do Mercado Pago (Suas
integrações > Webhooks): `https://sonhoearte3d.com.br/api/mercadopago/webhook`.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- react-hook-form + zod (validação de formulários)
- Supabase (Auth + Postgres + Storage)

## Estrutura de pastas

```
src/
  components/       Componentes reutilizáveis (Header, Footer, cards, formulários de UI, etc.)
  components/ui/    Componentes de interface base (Button, Input, Textarea, Select, Toast)
  data/              Dados mockados centralizados (projetos, serviços, posts, categorias, contato)
  lib/               Funções utilitárias, hooks e schemas de validação
  pages/             Páginas / rotas da aplicação
  types/             Interfaces TypeScript compartilhadas
```

## Onde alterar as cores

As cores da marca estão definidas como tokens em [`tailwind.config.ts`](tailwind.config.ts), na seção
`theme.extend.colors` (`navy`, `purple`, `magenta`, `orange`, `cream`, `neutral`). Para ajustar a paleta,
basta alterar os valores hexadecimais ali. Variáveis auxiliares em HSL ficam em [`src/index.css`](src/index.css).

## Onde alterar as imagens

Todas as URLs de imagens usadas no site estão centralizadas nos arquivos dentro de `src/data/`
(principalmente `projetos.ts`, `posts.ts` e diretamente no `Home.tsx` para imagens de seção). Basta trocar
a URL (`url`) e o texto alternativo (`alt`) correspondente.

## Onde alterar os dados mockados

- `src/data/projetos.ts`: projetos do portfólio
- `src/data/servicos.ts`: serviços e etapas do processo ("Como funciona")
- `src/data/posts.ts`: posts do blog
- `src/data/categorias.ts`: categorias do portfólio
- `src/data/institucional.ts`: textos institucionais e dados de contato

## Como adicionar um novo projeto

Adicione um novo objeto ao array `projetos` em [`src/data/projetos.ts`](src/data/projetos.ts), seguindo a
interface `Projeto` definida em [`src/types/index.ts`](src/types/index.ts). O campo `slug` deve ser único,
pois é usado na URL `/portfolio/:slug`. Marque `destaque: true` para que o projeto apareça na Home.

## Como adicionar um novo post

Adicione um novo objeto ao array `posts` em [`src/data/posts.ts`](src/data/posts.ts), seguindo a interface
`Post`. O campo `slug` deve ser único, pois é usado na URL `/blog/:slug`.

## Formulários (Orçamento e Contato)

Ambos os formulários usam `react-hook-form` com validação `zod`.

- **Orçamento** (`/orcamento`): envia um e-mail real (ver seção "Deploy na Vercel" acima) para
  `CONTACT_EMAIL`, com todos os dados preenchidos e o arquivo anexado (quando enviado, limite de 3MB). A
  lógica de envio fica em [`src/pages/Orcamento.tsx`](src/pages/Orcamento.tsx) e na função serverless
  [`api/orcamento.ts`](api/orcamento.ts).
- **Contato** (`/contato`): também envia um e-mail real para `CONTACT_EMAIL`, sem anexo. A lógica de envio
  fica em [`src/pages/Contato.tsx`](src/pages/Contato.tsx) e na função serverless
  [`api/contato.ts`](api/contato.ts).

## Autenticação e papéis

Cadastro/login usam e-mail e senha via Supabase Auth (`src/lib/AuthProvider.tsx`, montado em
`src/App.tsx`), com confirmação de e-mail obrigatória e fluxo de recuperação de senha
(`/esqueci-senha` e `/redefinir-senha`). Cada usuário tem uma linha em `profiles` (criada automaticamente
por trigger no cadastro) com um `role`: `customer` (padrão) ou `admin`. Não existe um usuário admin
genérico — o dono da loja se cadastra pelo fluxo normal e depois é promovido a admin via SQL, conforme
descrito em [`supabase/README.md`](supabase/README.md).

Todas as tabelas relacionadas a usuário/pedido têm Row Level Security habilitado: cliente só acessa seus
próprios dados, admin tem acesso ampliado via a função `public.is_admin()` (ver
[`supabase/migrations/0001_profiles.sql`](supabase/migrations/0001_profiles.sql)).

Páginas protegidas usam o componente `src/components/RequireAuth.tsx`, que redireciona para `/login`
quando não há sessão.

## Testando o envio de orçamento localmente

O endpoint `/api/orcamento` só existe como função serverless da Vercel, então `npm run dev` (Vite puro) não o
executa, isso é esperado. Para testar localmente:

```bash
npm install -g vercel
vercel dev
```

Crie um `.env.local` (baseado em [`.env.example`](.env.example)) com `RESEND_API_KEY` e `CONTACT_EMAIL`
antes de rodar `vercel dev`. Alternativamente, teste em um deploy de preview na Vercel, que já lê as
variáveis de ambiente configuradas no projeto.

## Observações

- Nenhum outro dado de contato além do WhatsApp, Instagram e Shopee em `src/data/institucional.ts` é real;
  substitua conforme necessário.
