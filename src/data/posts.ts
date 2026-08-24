import type { Post } from "@/types";

// Centralize aqui as imagens dos posts do blog.
export const posts: Post[] = [
  {
    slug: "pla-vs-petg-qual-escolher",
    titulo: "PLA ou PETG: qual material escolher para o seu projeto",
    resumo:
      "Os dois materiais mais usados na impressão 3D doméstica têm diferenças importantes de resistência, acabamento e aplicação. Entenda quando usar cada um.",
    conteudo: [
      "PLA e PETG são, hoje, os materiais mais comuns na impressão 3D por filamento. Apesar de parecidos em processo, eles se comportam de forma bem diferente quando a peça já está pronta.",
      "O PLA é derivado de fontes renováveis, tem excelente acabamento superficial e é mais fácil de imprimir com detalhes finos. É a escolha ideal para objetos decorativos, miniaturas e peças que não sofrerão grande esforço mecânico ou exposição ao calor.",
      "Já o PETG oferece maior resistência ao impacto e à temperatura, sendo indicado para objetos funcionais, peças que ficam em ambientes externos ou que precisam suportar uso mais intenso.",
      "Na prática, a escolha depende do propósito da peça. Um vaso decorativo de mesa pode ser perfeitamente executado em PLA. Já um suporte que ficará exposto ao sol ou uma peça de uso frequente tende a se beneficiar do PETG.",
    ],
    categoria: "Materiais",
    data: "2026-06-12",
    imagem: {
      url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop",
      alt: "Bobinas de filamento colorido para impressão 3D",
    },
    autor: "Equipe Sonho e Arte",
  },
  {
    slug: "cuidados-com-pecas-impressas",
    titulo: "Como cuidar das suas peças impressas em 3D",
    resumo:
      "Pequenos cuidados no dia a dia prolongam a vida útil e mantêm a aparência original das suas peças impressas.",
    conteudo: [
      "Peças impressas em 3D, especialmente em PLA, têm sensibilidade a temperaturas elevadas. Evite deixar objetos expostos diretamente ao sol por longos períodos ou próximos a fontes de calor.",
      "Para limpeza, um pano levemente úmido é suficiente na maioria dos casos. Evite produtos abrasivos ou solventes fortes, que podem danificar o acabamento superficial da peça.",
      "Peças com detalhes finos ou elementos vazados merecem atenção redobrada ao manusear, especialmente durante o transporte ou reposicionamento em prateleiras e estantes.",
      "Seguindo esses cuidados simples, uma peça impressa em 3D pode durar anos mantendo sua aparência original.",
    ],
    categoria: "Cuidados",
    data: "2026-05-28",
    imagem: {
      url: "https://images.unsplash.com/photo-1591634616938-1dfa07f0d8b0?q=80&w=1600&auto=format&fit=crop",
      alt: "Detalhe de peça impressa em 3D com textura em camadas",
    },
    autor: "Equipe Sonho e Arte",
  },
  {
    slug: "presentes-personalizados-impressao-3d",
    titulo: "Por que um presente impresso em 3D é diferente de qualquer outro",
    resumo:
      "Presentes personalizados carregam significado. Veja como a impressão 3D permite criar objetos únicos que não existem prontos em nenhuma loja.",
    conteudo: [
      "Um presente pronto, comprado em qualquer loja, carrega um significado limitado. Já um objeto pensado especificamente para uma pessoa, com sua história ou seu gosto em mente, transmite outro tipo de cuidado.",
      "A impressão 3D permite justamente isso: transformar uma referência pessoal, uma data importante ou uma ideia específica em um objeto físico único, sem depender de moldes ou produção em massa.",
      "Desde porta retratos com formas orgânicas até miniaturas de personagens ou réplicas de espaços afetivos, as possibilidades de personalização são amplas.",
      "Se você tem uma ideia de presente mas não sabe como transformá-la em um objeto real, esse é exatamente o tipo de projeto que gostamos de desenvolver junto com o cliente.",
    ],
    categoria: "Presentes",
    data: "2026-05-10",
    imagem: {
      url: "https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?q=80&w=1600&auto=format&fit=crop",
      alt: "Porta retrato personalizado impresso em 3D",
    },
    autor: "Equipe Sonho e Arte",
  },
  {
    slug: "do-arquivo-a-peca-como-funciona-a-impressao-3d",
    titulo: "Do arquivo à peça: como funciona o processo de impressão 3D",
    resumo:
      "Entenda, de forma simples, o caminho que um modelo digital percorre até se tornar um objeto físico na sua mão.",
    conteudo: [
      "Todo processo de impressão 3D começa com um modelo digital tridimensional, seja ele criado do zero, adaptado de uma referência ou obtido por escaneamento.",
      "Esse arquivo é então fatiado em camadas horizontais por um software específico, que traduz a geometria em um caminho que a impressora seguirá, camada após camada.",
      "Durante a impressão, o material (geralmente um filamento termoplástico ou uma resina fotopolimérica) é depositado ou curado camada a camada, até que a peça esteja completa.",
      "Por fim, a peça passa por um processo de acabamento, que pode incluir remoção de suportes, lixamento leve ou pintura, dependendo do resultado desejado.",
    ],
    categoria: "Tecnologia",
    data: "2026-04-22",
    imagem: {
      url: "https://images.unsplash.com/photo-1631130586916-fb0e8b6f6b1a?q=80&w=1600&auto=format&fit=crop",
      alt: "Impressora 3D em operação produzindo uma peça",
    },
    autor: "Equipe Sonho e Arte",
  },
];
