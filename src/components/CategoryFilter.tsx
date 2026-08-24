import type { Categoria } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categorias: Categoria[];
  ativa: string | null;
  onChange: (slug: string | null) => void;
}

export function CategoryFilter({ categorias, ativa, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "label-caps pb-1 border-b transition-colors",
          ativa === null ? "text-navy border-magenta" : "text-neutral border-transparent hover:text-navy"
        )}
      >
        Todos
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria.slug}
          onClick={() => onChange(categoria.slug)}
          className={cn(
            "label-caps pb-1 border-b transition-colors",
            ativa === categoria.slug ? "text-navy border-magenta" : "text-neutral border-transparent hover:text-navy"
          )}
        >
          {categoria.nome}
        </button>
      ))}
    </div>
  );
}
