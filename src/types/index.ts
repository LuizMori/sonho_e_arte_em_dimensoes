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

export interface Projeto {
  slug: string;
  numero: string;
  nome: string;
  categoria: CategoriaSlug;
  destaque: boolean;
  capa: ProjetoImagem;
  galeria: ProjetoImagem[];
  material: string;
  tecnologia: string;
  dimensoes: string;
  quantidade: string;
  descricao: string;
  aplicacoes: string[];
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
  endereco: string;
  email: string;
  whatsapp: string;
  telefone: string;
  redesSociais: { nome: string; url: string }[];
}
