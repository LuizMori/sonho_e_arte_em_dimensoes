import { useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectCard } from "@/components/ProjectCard";
import { projetos } from "@/data/projetos";
import { categorias } from "@/data/categorias";

const aspectPattern = ["aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]"];

export function Portfolio() {
  usePageMeta(
    "Portfólio | Sonho e Arte em Dimensões",
    "Explore o portfólio de peças impressas em 3D da Sonho e Arte em Dimensões: decoração, personalizados, miniaturas, utilidades, protótipos e colecionáveis."
  );

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  const projetosFiltrados = useMemo(() => {
    if (!categoriaAtiva) return projetos;
    return projetos.filter((projeto) => projeto.categoria === categoriaAtiva);
  }, [categoriaAtiva]);

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="max-w-2xl mb-12">
          <p className="label-caps text-magenta mb-6">Trabalhos realizados</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy leading-[1.05]">
            Portfólio
          </h1>
        </Reveal>

        <Reveal delay={100} className="mb-16">
          <CategoryFilter categorias={categorias} ativa={categoriaAtiva} onChange={setCategoriaAtiva} />
        </Reveal>

        {projetosFiltrados.length === 0 ? (
          <p className="text-navy/60">Nenhum projeto encontrado nesta categoria no momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {projetosFiltrados.map((projeto, index) => (
              <Reveal
                key={projeto.slug}
                delay={(index % 6) * 60}
                className={index % 5 === 2 ? "lg:mt-16" : undefined}
              >
                <ProjectCard projeto={projeto} imageAspect={aspectPattern[index % aspectPattern.length]} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
