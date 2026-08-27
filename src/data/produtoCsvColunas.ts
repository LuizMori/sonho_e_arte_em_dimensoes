// Colunas do CSV de produtos, compartilhadas entre a importação
// (AdminProdutoImportar) e a exportação (AdminProdutos).
export const COLUNAS_PRODUTO_CSV = [
  "nome",
  "descricao",
  "preco",
  "categoria",
  "peso_kg",
  "altura_cm",
  "largura_cm",
  "comprimento_cm",
  "stock",
  "ativo",
  "destaque",
  "fotos",
  "slug",
  "tamanho_exibicao",
  "cores",
  "variacoes",
] as const;
