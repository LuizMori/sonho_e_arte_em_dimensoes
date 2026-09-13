// Colunas do CSV de pingentes, compartilhadas entre a importação
// (AdminPingentesImportar) e a exportação (AdminPingentes).
export const COLUNAS_PINGENTE_CSV = ["nome", "preco", "estoque", "imagem_url", "cores"] as const;
