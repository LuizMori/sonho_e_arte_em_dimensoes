import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { ProjectCard } from "@/components/ProjectCard";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { DecorCurve, DecorStar } from "@/components/Decor";
import { Button } from "@/components/ui/Button";
import { projetosDestaque } from "@/data/projetos";
import { servicos } from "@/data/servicos";
import { filosofia } from "@/data/institucional";

const heroImage =
  "https://images.unsplash.com/photo-1581092787765-e3feb951d987?q=80&w=1920&auto=format&fit=crop";

const dreamSteps = [
  {
    numero: "01",
    titulo: "A ideia",
    descricao: "Uma referência, uma foto ou apenas um desejo ainda sem forma definida.",
  },
  {
    numero: "02",
    titulo: "O modelo digital",
    descricao: "A ideia é traduzida em um arquivo tridimensional, pronto para ser fatiado em camadas.",
  },
  {
    numero: "03",
    titulo: "A peça física",
    descricao: "Camada após camada, o objeto ganha volume, textura e presença real.",
  },
];

const personalizacaoImagens = [
  {
    url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1200&auto=format&fit=crop",
    alt: "Figuras colecionáveis personalizadas impressas em 3D",
    nome: "Colecionáveis",
  },
  {
    url: "https://images.unsplash.com/photo-1518281420975-50db6e5d0a97?q=80&w=1200&auto=format&fit=crop",
    alt: "Porta retrato personalizado impresso em 3D",
    nome: "Presentes",
  },
  {
    url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1200&auto=format&fit=crop",
    alt: "Vaso decorativo personalizado impresso em 3D",
    nome: "Decoração",
  },
];

export function Home() {
  usePageMeta(
    "Sonho e Arte em Dimensões | Impressão 3D",
    "Transformamos ideias em objetos reais através da impressão 3D. Peças personalizadas, decoração, miniaturas, protótipos e muito mais."
  );

  return (
    <>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-navy-deep">
        <img
          src={heroImage}
          alt="Impressora 3D em operação produzindo uma peça em camadas"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/70 via-35% to-transparent" />

        <div className="relative h-full container flex flex-col justify-end pb-16 sm:pb-24">
          <p className="label-caps text-orange mb-6 animate-fade-up">Estúdio de impressão 3D</p>
          <h1 className="font-display text-cream-light text-5xl sm:text-7xl lg:text-8xl leading-[0.98] tracking-tightest max-w-4xl animate-fade-up">
            Sua ideia ganhou uma nova dimensão.
          </h1>
          <p className="text-cream-light/80 text-base sm:text-lg max-w-lg mt-8 leading-relaxed animate-fade-up">
            Transformamos projetos, ideias e criatividade em objetos reais através da impressão 3D.
          </p>
          <div className="flex flex-wrap gap-4 mt-10 animate-fade-up">
            <Link to="/orcamento">
              <Button variant="primary" className="bg-cream-light text-navy hover:bg-magenta hover:text-cream-light">
                Solicitar orçamento
              </Button>
            </Link>
            <Link to="/portfolio">
              <Button variant="outline" className="border-cream-light/50 text-cream-light hover:border-orange hover:text-orange">
                Ver nossos projetos
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 sm:right-10 hidden sm:block">
          <ScrollIndicator />
        </div>
      </section>

      {/* Projetos em destaque */}
      <section className="py-24 md:py-32">
        <div className="container">
          <Reveal className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
            <SectionTitle label="Trabalhos selecionados" title="Projetos em destaque" />
            <Link to="/portfolio" className="label-caps text-navy/70 hover:text-magenta transition-colors shrink-0">
              Ver portfólio completo
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
            {projetosDestaque.map((projeto, index) => (
              <Reveal
                key={projeto.slug}
                delay={index * 80}
                className={index % 3 === 1 ? "md:mt-20" : undefined}
              >
                <ProjectCard
                  projeto={projeto}
                  imageAspect={index % 3 === 0 ? "aspect-[4/5]" : "aspect-[3/4]"}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Institucional */}
      <section className="py-24 md:py-32 bg-cream-light">
        <div className="container grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-24 items-center">
          <Reveal>
            <DecorStar className="w-8 h-8 text-orange mb-8" />
            <SectionTitle label="Nossa filosofia" title={filosofia.titulo} />
          </Reveal>
          <Reveal delay={120} className="space-y-6">
            {filosofia.paragrafos.map((paragrafo) => (
              <p key={paragrafo} className="text-navy/70 leading-relaxed text-base sm:text-lg">
                {paragrafo}
              </p>
            ))}
            <Link to="/sobre" className="label-caps text-magenta inline-block pt-2">
              Conheça o estúdio
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Do sonho à realidade */}
      <section className="py-24 md:py-32">
        <div className="container">
          <Reveal className="max-w-xl mb-16">
            <SectionTitle label="Do digital para o mundo real" title="Do sonho à realidade" />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {dreamSteps.map((step, index) => (
              <Reveal key={step.numero} delay={index * 100}>
                <span className="font-display text-5xl text-orange/80">{step.numero}</span>
                <h3 className="font-display text-2xl text-navy mt-4">{step.titulo}</h3>
                <p className="text-navy/70 mt-3 leading-relaxed">{step.descricao}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16 opacity-70">
            <DecorCurve className="max-w-md text-neutral" />
          </Reveal>
        </div>
      </section>

      {/* Serviços principais */}
      <section className="py-24 md:py-32 bg-navy text-cream-light relative overflow-hidden">
        <div className="container relative">
          <Reveal className="max-w-xl mb-16">
            <SectionTitle
              label="O que produzimos"
              title="Serviços principais"
              light
            />
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {servicos.slice(0, 6).map((servico, index) => (
              <Reveal key={servico.slug} delay={index * 60}>
                <span className="label-caps text-orange">{servico.numero}</span>
                <h3 className="font-display text-2xl mt-2">{servico.nome}</h3>
                <p className="text-cream-light/70 mt-2 text-sm leading-relaxed">{servico.descricaoCurta}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <Link to="/servicos" className="label-caps text-orange hover:text-cream-light transition-colors">
              Ver todos os serviços
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Como funciona (resumo) */}
      <section className="py-24 md:py-32">
        <div className="container grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20">
          <Reveal>
            <SectionTitle
              label="Processo"
              title="Como funciona"
              description="Da ideia inicial até a peça em suas mãos, um processo simples e acompanhado de perto."
            />
            <Link to="/como-funciona" className="label-caps text-magenta inline-block mt-8">
              Entenda todas as etapas
            </Link>
          </Reveal>
          <div className="space-y-8">
            {["Você tem uma ideia", "Avaliamos o projeto", "Produzimos sua peça"].map((titulo, index) => (
              <Reveal key={titulo} delay={index * 90} className="flex gap-6 items-start">
                <span className="font-display text-3xl text-orange shrink-0">0{index + 1}</span>
                <p className="text-navy/80 text-lg pt-1">{titulo}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Personalização */}
      <section className="py-24 md:py-32 bg-cream-light">
        <div className="container">
          <Reveal className="max-w-xl mb-16">
            <SectionTitle label="Feito para ser seu" title="Personalização em cada detalhe" />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {personalizacaoImagens.map((item, index) => (
              <Reveal key={item.nome} delay={index * 80}>
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full h-full object-cover img-hover"
                  />
                </div>
                <p className="label-caps text-navy/70 mt-4">{item.nome}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-28 md:py-36 bg-navy-deep text-cream-light text-center relative overflow-hidden">
        <Reveal className="container max-w-2xl mx-auto">
          <p className="label-caps text-orange mb-6">Vamos começar</p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tightest leading-[1.05]">
            Você imagina. A gente ajuda a dar forma.
          </h2>
          <div className="mt-10">
            <Link to="/orcamento">
              <Button className="bg-orange text-cream-light hover:bg-magenta">Solicitar orçamento</Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
