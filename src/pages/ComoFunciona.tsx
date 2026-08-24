import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { ProcessStep } from "@/components/ProcessStep";
import { Button } from "@/components/ui/Button";
import { etapasProcesso } from "@/data/servicos";

export function ComoFunciona() {
  usePageMeta(
    "Como funciona | Sonho e Arte em Dimensões",
    "Entenda como funciona o processo de trabalho da Sonho e Arte em Dimensões, do envio da ideia até a produção da peça em impressão 3D."
  );

  return (
    <>
      <section className="pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="container">
          <Reveal>
            <p className="label-caps text-magenta mb-6">Processo</p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy max-w-2xl leading-[1.05]">
              Como funciona
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container max-w-2xl">
          {etapasProcesso.map((etapa, index) => (
            <Reveal key={etapa.numero} delay={index * 60}>
              <ProcessStep etapa={etapa} isLast={index === etapasProcesso.length - 1} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-24 md:py-32 bg-cream-light">
        <div className="container grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
          <Reveal>
            <SectionTitle
              label="Sem arquivo 3D?"
              title="Não tem o arquivo 3D? Podemos avaliar sua ideia."
            />
            <p className="text-navy/70 text-lg mt-6 leading-relaxed max-w-lg">
              Você não precisa ter conhecimento técnico sobre modelagem ou impressão 3D. Envie uma foto, um desenho,
              uma referência visual ou apenas descreva o que você imagina, e eu avalio a viabilidade do projeto
              junto com você.
            </p>
            <Link to="/orcamento" className="inline-block mt-8">
              <Button>Enviar minha ideia</Button>
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <img
              src="https://images.unsplash.com/photo-1524634126442-357e0eac3c14?q=80&w=1200&auto=format&fit=crop"
              alt="Esboço de referência ao lado de peça impressa em 3D"
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
