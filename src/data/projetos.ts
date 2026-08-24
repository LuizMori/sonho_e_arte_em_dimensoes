import type { Projeto } from "@/types";

// Centralize aqui todas as URLs de imagens dos projetos.
// Para trocar uma imagem, basta substituir a URL correspondente.
export const projetos: Projeto[] = [
  {
    slug: "vaso-espiral-organico",
    numero: "01",
    nome: "Vaso Espiral Orgânico",
    categoria: "decoracao",
    destaque: true,
    capa: {
      url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop",
      alt: "Vaso decorativo impresso em 3D com padrão espiral roxo sobre mesa de madeira",
    },
    galeria: [
      {
        url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1800&auto=format&fit=crop",
        alt: "Vaso espiral visto de frente sobre fundo neutro",
      },
      {
        url: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1800&auto=format&fit=crop",
        alt: "Detalhe da textura impressa em camadas do vaso",
      },
      {
        url: "https://images.unsplash.com/photo-1581092787765-e3feb951d987?q=80&w=1800&auto=format&fit=crop",
        alt: "Vaso posicionado em ambiente decorado",
      },
    ],
    material: "PLA premium",
    tecnologia: "FDM",
    dimensoes: "18 x 18 x 32 cm",
    quantidade: "Peça única",
    descricao:
      "Um estudo de forma contínua, onde a espiral nasce da base e se estende até o gargalo em um único filete de impressão. A peça explora a capacidade da manufatura aditiva de criar geometrias que seriam difíceis de obter por métodos tradicionais.",
    aplicacoes: [
      "Decoração de mesa de jantar ou aparador",
      "Presente personalizado com gravação de iniciais",
      "Adaptação de escala para vitrines comerciais",
    ],
  },
  {
    slug: "miniatura-arquitetonica-residencial",
    numero: "02",
    nome: "Miniatura Arquitetônica Residencial",
    categoria: "miniaturas",
    destaque: true,
    capa: {
      url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1600&auto=format&fit=crop",
      alt: "Maquete arquitetônica impressa em 3D de uma residência moderna",
    },
    galeria: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1800&auto=format&fit=crop",
        alt: "Maquete residencial vista em ângulo",
      },
      {
        url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1800&auto=format&fit=crop",
        alt: "Detalhe de telhado e janelas da miniatura",
      },
    ],
    material: "Resina fotopolimérica",
    tecnologia: "SLA",
    dimensoes: "24 x 16 x 12 cm",
    quantidade: "Peça única",
    descricao:
      "Reprodução fiel de um projeto arquitetônico a partir de arquivos de modelagem fornecidos pelo cliente. A impressão em resina permite alto nível de detalhe em elementos finos como esquadrias e telhados.",
    aplicacoes: [
      "Apresentação de projetos para clientes e investidores",
      "Presente de inauguração de imóvel",
      "Portfólio físico para escritórios de arquitetura",
    ],
  },
  {
    slug: "colecao-personagens-colecionaveis",
    numero: "03",
    nome: "Coleção Personagens Colecionáveis",
    categoria: "colecionaveis",
    destaque: true,
    capa: {
      url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1600&auto=format&fit=crop",
      alt: "Figuras colecionáveis pintadas impressas em 3D",
    },
    galeria: [
      {
        url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1800&auto=format&fit=crop",
        alt: "Conjunto de figuras coloridas sobre base neutra",
      },
      {
        url: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?q=80&w=1800&auto=format&fit=crop",
        alt: "Detalhe de pintura de uma figura colecionável",
      },
    ],
    material: "Resina + pintura manual",
    tecnologia: "SLA",
    dimensoes: "8 a 12 cm de altura",
    quantidade: "Edição limitada",
    descricao:
      "Personagens desenvolvidos a partir de referências visuais enviadas pelo cliente, impressos em alta resolução e finalizados com pintura manual para acabamento colecionável.",
    aplicacoes: [
      "Presentes personalizados para fãs de cultura pop",
      "Edições limitadas para eventos e coleções",
      "Peças de exibição em estantes e vitrines",
    ],
  },
  {
    slug: "porta-retrato-organico-personalizado",
    numero: "04",
    nome: "Porta Retrato Orgânico Personalizado",
    categoria: "personalizados",
    destaque: true,
    capa: {
      url: "https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?q=80&w=1600&auto=format&fit=crop",
      alt: "Porta retrato impresso em 3D com formas orgânicas sobre mesa clara",
    },
    galeria: [
      {
        url: "https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?q=80&w=1800&auto=format&fit=crop",
        alt: "Porta retrato com fotografia em ambiente iluminado",
      },
      {
        url: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1800&auto=format&fit=crop",
        alt: "Detalhe do acabamento em curva do porta retrato",
      },
    ],
    material: "PLA premium bicolor",
    tecnologia: "FDM",
    dimensoes: "10 x 15 x 6 cm",
    quantidade: "Peça única personalizável",
    descricao:
      "Objeto afetivo desenvolvido para presentear datas especiais. A forma orgânica abraça a fotografia, e as cores podem ser personalizadas conforme a identidade de quem recebe o presente.",
    aplicacoes: [
      "Presente de casamento, aniversário ou nascimento",
      "Personalização com nome ou data gravada",
      "Produção em pares para casais ou famílias",
    ],
  },
];

export const projetosDestaque = projetos.filter((projeto) => projeto.destaque);
