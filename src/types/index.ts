export type CategoriaSlug =
  | "decoracao"
  | "personalizados"
  | "miniaturas"
  | "colecionaveis";

export interface Categoria {
  slug: CategoriaSlug;
  nome: string;
}

export interface ProjetoImagem {
  url: string;
  alt: string;
}

export interface Servico {
  slug: string;
  numero: string;
  nome: string;
  descricaoCurta: string;
  descricao: string;
  exemplos: string[];
}

export interface EtapaProcesso {
  numero: string;
  titulo: string;
  descricao: string;
}

export interface Post {
  slug: string;
  titulo: string;
  resumo: string;
  conteudo: string[];
  categoria: string;
  data: string;
  imagem: ProjetoImagem;
  autor: string;
}

export interface InformacaoInstitucional {
  titulo: string;
  paragrafos: string[];
}

export interface ContatoInfo {
  email: string;
  whatsapp: string;
  redesSociais: { nome: string; url: string }[];
}

export type UserRole = "customer" | "admin";

export interface Profile {
  id: string;
  nome: string | null;
  role: UserRole;
  created_at: string;
}

export interface ProdutoImagemDb {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  ordem: number;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  peso_kg: number;
  altura_cm: number;
  largura_cm: number;
  comprimento_cm: number;
  stock: number;
  ativo: boolean;
  categoria: CategoriaSlug;
  destaque: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ProdutoComImagens extends Produto {
  product_images: ProdutoImagemDb[];
}

export type OrderStatus = "pending_payment" | "paid" | "shipped" | "cancelled" | "expired";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  frete_valor: number;
  total: number;
  cep_destino: string;
  endereco_json: { cep?: string; frete_nome?: string };
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  reserved_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemDb {
  id: string;
  order_id: string;
  product_id: string;
  quantidade: number;
  preco_unitario: number;
  created_at: string;
}

export interface OrderItemComProduto extends OrderItemDb {
  products: Pick<Produto, "nome" | "slug"> | null;
}
