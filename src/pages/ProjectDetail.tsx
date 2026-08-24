import { Link, Navigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Gallery } from "@/components/Gallery";
import { Button } from "@/components/ui/Button";
import { projetos } from "@/data/projetos";
import { categorias } from "@/data/categorias";

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const index = projetos.findIndex((p) => p.slug === slug);
  const projeto = index >= 0 ? projetos[index] : undefined;

  usePageMeta(
    projeto ? `${projeto.nome} | Portfólio | Sonho e Arte em Dimensões` : "Projeto não encontrado",
    projeto?.descricao ?? "Projeto não encontrado no portfólio da Sonho e Arte em Dimensões."
  );

  if (!projeto) {
    return <Navigate to="/portfolio" replace />;
  }

  const categoria = categorias.find((c) => c.slug === projeto.categoria);
  const proximo = projetos[(index + 1) % projetos.length];

  const metadados = [
    { label: "Categoria", valor: categoria?.nome ?? "" },
    { label: "Material", valor: projeto.material },
    { label: "Tecnologia", valor: projeto.tecnologia },
    { label: "Dimensões", valor: projeto.dimensoes },
    { label: "Quantidade", valor: projeto.quantidade },
  ];

  return (
    <>
      <section className="pt-32 md:pt-36">
        <div className="container">
          <Reveal>
            <Link to="/portfolio" className="label-caps text-navy/60 hover:text-magenta transition-colors">
              Voltar ao portfólio
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="pt-8 pb-16 md:pb-24">
        <div className="container">
          <Reveal className="flex items-start justify-between gap-6 mb-8">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-tightest text-navy leading-[1.02] max-w-3xl">
              {projeto.nome}
            </h1>
            <span className="font-display text-3xl text-orange shrink-0 hidden sm:block">{projeto.numero}</span>
          </Reveal>
          <Reveal delay={100}>
            <img
              src={projeto.capa.url}
              alt={projeto.capa.alt}
              className="w-full h-auto max-h-[80vh] object-cover"
            />
          </Reveal>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container grid grid-cols-1 lg:grid-cols-[0.7fr_1fr] gap-12 lg:gap-24">
          <Reveal>
            <dl className="space-y-6 lg:sticky lg:top-32">
              {metadados.map((item) => (
                <div key={item.label} className="border-b border-neutral-light pb-4">
                  <dt className="label-caps text-neutral">{item.label}</dt>
                  <dd className="text-navy text-lg mt-1">{item.valor}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div>
            <Reveal>
              <p className="text-navy/80 text-lg sm:text-xl leading-relaxed font-display font-light">
                {projeto.descricao}
              </p>
            </Reveal>

            <Reveal delay={100} className="mt-14">
              <p className="label-caps text-neutral mb-5">Aplicações e possibilidades</p>
              <ul className="space-y-3">
                {projeto.aplicacoes.map((aplicacao) => (
                  <li key={aplicacao} className="text-navy/70 flex gap-3">
                    <span className="text-magenta">•</span>
                    <span>{aplicacao}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {projeto.galeria.length > 0 && (
        <section className="pb-24 md:pb-32">
          <div className="container">
            <Gallery imagens={projeto.galeria} />
          </div>
        </section>
      )}

      <section className="py-24 md:py-32 bg-navy text-cream-light text-center">
        <Reveal className="container max-w-xl mx-auto">
          <p className="font-display text-3xl sm:text-4xl tracking-tightest leading-[1.15]">
            Gostou deste projeto? Podemos criar algo semelhante para você.
          </p>
          <div className="mt-10">
            <Link to="/orcamento">
              <Button className="bg-orange text-cream-light hover:bg-magenta">Solicitar orçamento</Button>
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="py-16 md:py-20 border-t border-neutral-light">
        <div className="container">
          <Link to={`/portfolio/${proximo.slug}`} className="group flex items-center justify-between gap-6">
            <div>
              <p className="label-caps text-neutral mb-2">Próximo projeto</p>
              <p className="font-display text-3xl sm:text-4xl text-navy group-hover:text-magenta transition-colors">
                {proximo.nome}
              </p>
            </div>
            <span className="font-display text-2xl text-orange">{proximo.numero}</span>
          </Link>
        </div>
      </section>
    </>
  );
}
