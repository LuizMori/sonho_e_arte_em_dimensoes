import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { ServiceItem } from "@/components/ServiceItem";
import { Button } from "@/components/ui/Button";
import { servicos } from "@/data/servicos";

export function Servicos() {
  usePageMeta(
    "Serviços | Sonho e Arte em Dimensões",
    "Conheça os serviços da Sonho e Arte em Dimensões: impressão 3D, peças personalizadas, protótipos, miniaturas, decoração, objetos funcionais e mais."
  );

  return (
    <>
      <section className="pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="container">
          <Reveal>
            <p className="label-caps text-magenta mb-6">O que fazemos</p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy max-w-2xl leading-[1.05]">
              Serviços
            </h1>
            <p className="text-navy/70 text-lg max-w-xl mt-6 leading-relaxed">
              Da primeira ideia até o objeto acabado, oferecemos um conjunto de serviços que cobre diferentes
              necessidades de fabricação digital.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container">
          {servicos.map((servico, index) => (
            <Reveal key={servico.slug} delay={Math.min(index * 40, 200)}>
              <ServiceItem servico={servico} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-24 md:py-32 bg-navy text-cream-light text-center">
        <Reveal className="container max-w-xl mx-auto">
          <p className="font-display text-3xl sm:text-4xl tracking-tightest leading-[1.15]">
            Não encontrou exatamente o que precisa? Fale com a gente.
          </p>
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
