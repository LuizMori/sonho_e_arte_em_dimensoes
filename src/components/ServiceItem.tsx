import type { Servico } from "@/types";

export function ServiceItem({ servico }: { servico: Servico }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 md:gap-10 py-10 border-b border-neutral-light">
      <span className="font-display text-3xl text-orange">{servico.numero}</span>
      <div>
        <h3 className="font-display text-3xl text-navy leading-tight">{servico.nome}</h3>
        <p className="text-navy/70 mt-3 leading-relaxed">{servico.descricao}</p>
      </div>
      <div>
        <p className="label-caps text-neutral mb-3">Aplicações</p>
        <ul className="space-y-2">
          {servico.exemplos.map((exemplo) => (
            <li key={exemplo} className="text-sm text-navy/70 flex gap-3">
              <span className="text-magenta">•</span>
              <span>{exemplo}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
