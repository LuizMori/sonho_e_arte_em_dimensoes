import type { Categoria } from "@/types";

// Categorias reais de produto, atribuíveis no cadastro (mesmo conjunto do check
// constraint de products.categoria).
export const categoriasProduto: Categoria[] = [
  { slug: "decoracao", nome: "Decoração" },
  { slug: "educativos", nome: "Educativos" },
  { slug: "papelaria", nome: "Papelaria" },
  { slug: "religiosos", nome: "Religiosos" },
  { slug: "geek", nome: "Geek" },
  { slug: "presentes", nome: "Presentes" },
  { slug: "sazonais", nome: "Sazonais" },
];

// Abas do filtro do Portfólio: as categorias de produto + "Personalizados", que não é
// uma categoria atribuível a produtos, só uma aba informativa (sugestões + galeria de
// peças já feitas sob encomenda).
export const categorias: Categoria[] = [
  ...categoriasProduto,
  { slug: "personalizados", nome: "Personalizados" },
];
