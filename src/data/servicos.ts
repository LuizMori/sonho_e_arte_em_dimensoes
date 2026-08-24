import type { Servico, EtapaProcesso } from "@/types";

export const servicos: Servico[] = [
  {
    slug: "impressao-3d",
    numero: "01",
    nome: "Impressão 3D",
    descricaoCurta: "Produção de peças a partir de arquivos digitais em diferentes tecnologias e materiais.",
    descricao:
      "O núcleo do nosso trabalho é transformar um arquivo digital em um objeto físico com precisão e acabamento cuidadoso. Trabalhamos com diferentes tecnologias de impressão para atender desde peças simples até geometrias complexas.",
    exemplos: ["Peças técnicas e orgânicas", "Objetos de uso pessoal", "Reproduções e réplicas"],
  },
  {
    slug: "pecas-personalizadas",
    numero: "02",
    nome: "Peças Personalizadas",
    descricaoCurta: "Desenvolvimento de objetos únicos, adaptados ao gosto e necessidade de cada cliente.",
    descricao:
      "Cada pessoa tem uma ideia diferente do que é especial. Ajudamos a transformar essa ideia em uma peça exclusiva, seja adaptando um modelo existente ou desenvolvendo algo do zero junto com você.",
    exemplos: ["Nomes e datas gravadas em relevo", "Adaptação de cores e proporções", "Objetos com identidade pessoal"],
  },
  {
    slug: "miniaturas-colecionaveis",
    numero: "03",
    nome: "Miniaturas e Colecionáveis",
    descricaoCurta: "Reproduções em escala e peças de coleção com atenção ao detalhe.",
    descricao:
      "Da arquitetura aos personagens, produzimos miniaturas com fidelidade de detalhe e acabamento cuidadoso, indicadas tanto para apresentação profissional quanto para coleções pessoais.",
    exemplos: ["Maquetes arquitetônicas", "Personagens e figuras de coleção", "Réplicas em escala reduzida"],
  },
  {
    slug: "decoracao",
    numero: "04",
    nome: "Decoração",
    descricaoCurta: "Objetos decorativos que unem forma escultórica e presença em ambientes.",
    descricao:
      "Vasos, esculturas de mesa e outros objetos que ocupam espaço com intenção. Exploramos geometrias que a impressão 3D torna possíveis, criando peças que dificilmente seriam produzidas por métodos convencionais.",
    exemplos: ["Vasos e esculturas de mesa", "Objetos decorativos com formas orgânicas", "Peças assinadas em pequenas séries"],
  },
  {
    slug: "objetos-funcionais",
    numero: "05",
    nome: "Objetos Funcionais",
    descricaoCurta: "Utilidades do dia a dia produzidas sob medida.",
    descricao:
      "Organizadores, suportes, ganchos e outras soluções práticas, desenvolvidas para resolver um problema específico do espaço ou da rotina do cliente.",
    exemplos: ["Organizadores sob medida", "Suportes e encaixes específicos", "Adaptações para uso doméstico"],
  },
  {
    slug: "presentes-personalizados",
    numero: "06",
    nome: "Presentes Personalizados",
    descricaoCurta: "Objetos afetivos criados para ocasiões e pessoas específicas.",
    descricao:
      "Um presente que carrega significado. Ajudamos a transformar uma ideia, uma data ou uma referência pessoal em um objeto que não se encontra pronto em nenhuma loja.",
    exemplos: ["Presentes de casamento e aniversário", "Lembranças de nascimento", "Homenagens e datas comemorativas"],
  },
  {
    slug: "projetos-sob-medida",
    numero: "07",
    nome: "Projetos Sob Medida",
    descricaoCurta: "Desenvolvimento completo de peças que ainda não existem como arquivo digital.",
    descricao:
      "Quando o projeto ainda não tem um modelo 3D pronto, trabalhamos a partir de referências, fotos, desenhos ou descrições para desenvolver o arquivo e, em seguida, produzir a peça.",
    exemplos: ["Modelagem a partir de referência visual", "Adaptação de ideias em esboço", "Projetos exclusivos do zero"],
  },
];

export const etapasProcesso: EtapaProcesso[] = [
  {
    numero: "01",
    titulo: "Você tem uma ideia",
    descricao: "Tudo começa com uma vontade: um objeto que falta no mundo, um presente, uma solução para o dia a dia.",
  },
  {
    numero: "02",
    titulo: "Envia o modelo ou referência",
    descricao: "Envie um arquivo 3D pronto ou, se não tiver, uma foto, desenho ou descrição do que você imagina.",
  },
  {
    numero: "03",
    titulo: "Avaliamos o projeto",
    descricao: "Analisamos a viabilidade técnica, o material mais indicado e o melhor caminho de produção.",
  },
  {
    numero: "04",
    titulo: "Calculamos o orçamento",
    descricao: "Com base em material, tempo de impressão e complexidade, apresentamos um valor claro e justo.",
  },
  {
    numero: "05",
    titulo: "Produzimos sua peça",
    descricao: "Com o orçamento aprovado, colocamos a peça em produção com acompanhamento cuidadoso.",
  },
  {
    numero: "06",
    titulo: "Você recebe o resultado",
    descricao: "Sua ideia, agora em três dimensões, pronta para ser usada, presenteada ou exibida.",
  },
];
