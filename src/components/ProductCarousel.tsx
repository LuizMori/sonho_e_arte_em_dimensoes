import { useRef, useState } from "react";
import type { TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import type { ProjetoImagem } from "@/types";

const LIMIAR_SWIPE_PX = 40;

export function ProductCarousel({ imagens, nomeProduto }: { imagens: ProjetoImagem[]; nomeProduto: string }) {
  const [indice, setIndice] = useState(0);
  const inicioToqueX = useRef<number | null>(null);

  if (imagens.length === 0) return null;

  const atual = imagens[indice] ?? imagens[0];
  const anterior = () => setIndice((i) => (i - 1 + imagens.length) % imagens.length);
  const proxima = () => setIndice((i) => (i + 1) % imagens.length);

  const handleTouchStart = (event: TouchEvent) => {
    inicioToqueX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (inicioToqueX.current === null) return;
    const delta = event.changedTouches[0].clientX - inicioToqueX.current;
    inicioToqueX.current = null;
    if (delta > LIMIAR_SWIPE_PX) anterior();
    else if (delta < -LIMIAR_SWIPE_PX) proxima();
  };

  return (
    <Reveal className="max-w-md mx-auto lg:mx-0">
      <div
        className="relative aspect-[4/3] overflow-hidden bg-neutral-light/40"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={atual.url}
          alt={atual.alt || nomeProduto}
          className="w-full h-full object-cover select-none"
          draggable={false}
        />

        {imagens.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-cream-light/90 text-navy flex items-center justify-center hover:bg-cream-light transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-cream-light/90 text-navy flex items-center justify-center hover:bg-cream-light transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 label-caps bg-navy/70 text-cream-light px-3 py-1 rounded-full">
              {indice + 1} / {imagens.length}
            </span>
          </>
        )}
      </div>

      {imagens.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
          {imagens.map((imagem, i) => (
            <button
              key={imagem.url + i}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden border-2 transition-colors ${
                i === indice ? "border-magenta" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={imagem.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Reveal>
  );
}
