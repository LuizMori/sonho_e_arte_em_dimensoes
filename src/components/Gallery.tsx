import type { ProjetoImagem } from "@/types";
import { Reveal } from "@/components/Reveal";

export function Gallery({ imagens }: { imagens: ProjetoImagem[] }) {
  return (
    <div className="flex flex-col gap-10 md:gap-16">
      {imagens.map((imagem, index) => (
        <Reveal key={imagem.url + index}>
          <img
            src={imagem.url}
            alt={imagem.alt}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </Reveal>
      ))}
    </div>
  );
}
