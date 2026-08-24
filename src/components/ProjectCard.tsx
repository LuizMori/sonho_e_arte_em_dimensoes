import { Link } from "react-router-dom";
import type { Projeto } from "@/types";
import { categorias } from "@/data/categorias";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  projeto: Projeto;
  className?: string;
  imageAspect?: string;
}

export function ProjectCard({ projeto, className, imageAspect = "aspect-[4/5]" }: ProjectCardProps) {
  const categoria = categorias.find((c) => c.slug === projeto.categoria);

  return (
    <Link to={`/portfolio/${projeto.slug}`} className={cn("group block", className)}>
      <div className={cn("overflow-hidden bg-neutral-light/40", imageAspect)}>
        <img
          src={projeto.capa.url}
          alt={projeto.capa.alt}
          loading="lazy"
          className="w-full h-full object-cover img-hover"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-navy group-hover:text-magenta transition-colors">
            {projeto.nome}
          </h3>
          {categoria && <p className="label-caps text-neutral mt-1">{categoria.nome}</p>}
        </div>
        <span className="font-display text-lg text-orange shrink-0">{projeto.numero}</span>
      </div>
    </Link>
  );
}
