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

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- React Router
- react-hook-form + zod (validação de formulários)

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

Os formulários em `/orcamento` e `/contato` usam `react-hook-form` com validação `zod`. No estado atual, o
envio é simulado: os dados são exibidos no console do navegador e um toast de sucesso é mostrado.

Para conectar um backend real, procure os comentários `// Envio simulado.` dentro de
[`src/pages/Orcamento.tsx`](src/pages/Orcamento.tsx) e [`src/pages/Contato.tsx`](src/pages/Contato.tsx) e
substitua a chamada simulada (`setTimeout`) por uma chamada de API real (`fetch`, cliente HTTP, etc.).

## Observações

- Nenhum dado de contato (endereço, telefone) é real; todos são placeholders claramente identificáveis em
  `src/data/institucional.ts`.
- O upload de arquivo no formulário de orçamento não realiza envio real de arquivo, apenas captura a seleção.
