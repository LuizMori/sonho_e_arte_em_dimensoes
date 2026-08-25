import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  to: string;
  nome: string;
  categoriaNome?: string;
  imagemUrl?: string;
  imagemAlt?: string;
  className?: string;
  imageAspect?: string;
}

export function ProjectCard({
  to,
  nome,
  categoriaNome,
  imagemUrl,
  imagemAlt,
  className,
  imageAspect = "aspect-[4/5]",
}: ProjectCardProps) {
  return (
    <Link to={to} className={cn("group block", className)}>
      <div className={cn("overflow-hidden bg-neutral-light/40", imageAspect)}>
        {imagemUrl && (
          <img
            src={imagemUrl}
            alt={imagemAlt ?? nome}
            loading="lazy"
            className="w-full h-full object-cover img-hover"
          />
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-display text-2xl text-navy group-hover:text-magenta transition-colors">{nome}</h3>
        {categoriaNome && <p className="label-caps text-neutral mt-1">{categoriaNome}</p>}
      </div>
    </Link>
  );
}
