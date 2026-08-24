import type { EtapaProcesso } from "@/types";

export function ProcessStep({ etapa, isLast }: { etapa: EtapaProcesso; isLast?: boolean }) {
  return (
    <div className="relative pl-10 sm:pl-14 pb-14">
      {!isLast && (
        <span className="absolute left-[15px] sm:left-[23px] top-3 bottom-0 w-px bg-neutral-light" aria-hidden="true" />
      )}
      <span className="absolute left-0 top-0 w-8 h-8 rounded-full border border-magenta text-magenta flex items-center justify-center text-xs font-medium bg-cream-light">
        {etapa.numero.replace("0", "")}
      </span>
      <h3 className="font-display text-2xl sm:text-3xl text-navy">{etapa.titulo}</h3>
      <p className="text-navy/70 mt-2 max-w-lg leading-relaxed">{etapa.descricao}</p>
    </div>
  );
}
