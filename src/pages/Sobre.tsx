import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { DecorStar } from "@/components/Decor";
import { historiaSobre } from "@/data/institucional";
import imagemDetalhe from "@/assets/sobre/peca-detalhe.jpeg";
import imagemCoracaoCerebro from "@/assets/sobre/peca-coracao-cerebro.jpeg";

const valores = [
  {
    titulo: "Precisão",
    descricao: "Cada peça passa por avaliação técnica cuidadosa antes de ir para produção.",
  },
  {
    titulo: "Criatividade",
    descricao: "Buscamos soluções de forma e função que vão além do modelo pronto.",
  },
  {
    titulo: "Personalização",
    descricao: "Acreditamos que o objeto certo é aquele feito sob medida para quem o recebe.",
  },
  {
    titulo: "Transparência",
    descricao: "Orçamentos claros e acompanhamento em todas as etapas da produção.",
  },
];

export function Sobre() {
  usePageMeta(
    "Sobre | Sonho e Arte em Dimensões",
    "Conheça a história, a filosofia e os valores da Sonho e Arte em Dimensões, um trabalho pequeno e pessoal dedicado a transformar ideias em objetos reais através da impressão 3D."
  );

  return (
    <>
      <section className="pt-40 pb-20 md:pt-48 md:pb-28">
        <div className="container">
          <Reveal>
            <p className="label-caps text-magenta mb-6">Sobre</p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy max-w-3xl leading-[1.05]">
              Do digital para o mundo real.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-12 lg:gap-12">
          <Reveal className="lg:sticky lg:top-32 self-start w-full max-w-xs lg:w-72">
            <img
              src={imagemDetalhe}
              alt="Peça impressa em 3D, detalhe de acabamento do estúdio"
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </Reveal>
          <div className="space-y-8">
            {historiaSobre.paragrafos.map((paragrafo, index) => (
              <Reveal key={paragrafo} delay={index * 80}>
                <p className="text-navy/80 text-lg sm:text-xl leading-relaxed font-display font-light">
                  {paragrafo}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Frase institucional destacada */}
      <section className="py-28 md:py-36 bg-navy text-cream-light text-center">
        <Reveal className="container max-w-3xl mx-auto">
          <DecorStar className="w-8 h-8 text-orange mx-auto mb-8" />
          <p className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tightest leading-[1.15]">
            Tecnologia para criar. Criatividade para transformar.
          </p>
        </Reveal>
      </section>

      {/* Valores */}
      <section className="py-24 md:py-32">
        <div className="container">
          <Reveal className="max-w-xl mb-16">
            <SectionTitle label="O que nos guia" title="Nossos valores" />
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {valores.map((valor, index) => (
              <Reveal key={valor.titulo} delay={index * 80}>
                <div className="w-10 h-px bg-magenta mb-5" />
                <h3 className="font-display text-2xl text-navy">{valor.titulo}</h3>
                <p className="text-navy/70 mt-2 text-sm leading-relaxed">{valor.descricao}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-cream-light">
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal className="aspect-[4/3] overflow-hidden">
            <img
              src={imagemCoracaoCerebro}
              alt="Figuras de coração e cérebro impressas em 3D, de mãos dadas"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </Reveal>
          <Reveal delay={100}>
            <SectionTitle
              title="Feito para ser seu"
              description="Cada projeto que chega até mim é tratado como único. Não replico soluções prontas: busco entender o que aquele objeto significa para quem o encomendou."
            />
            <Link to="/orcamento" className="label-caps text-magenta inline-block mt-8">
              Solicite um orçamento
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
