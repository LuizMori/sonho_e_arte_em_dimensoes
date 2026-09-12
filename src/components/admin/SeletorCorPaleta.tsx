import { useEffect, useRef, useState } from "react";

// Paleta curada de cores comuns, pensada pra quem não tem prática com seletor RGB/hex —
// clica na bolinha que parece certa, em vez de mexer em sliders. "Outra cor" no rodapé
// continua disponível pra um caso fora da paleta.
export const PALETA_HEX = [
  { nome: "Branco", hex: "#FFFFFF" },
  { nome: "Off-white", hex: "#F5F1EA" },
  { nome: "Preto", hex: "#1A1A1A" },
  { nome: "Cinza claro", hex: "#C7C7C7" },
  { nome: "Cinza", hex: "#7A7A7A" },
  { nome: "Prata", hex: "#C0C0C0" },
  { nome: "Azul claro", hex: "#7EC8E3" },
  { nome: "Azul", hex: "#2F6FED" },
  { nome: "Azul escuro", hex: "#1A3D8F" },
  { nome: "Turquesa", hex: "#3FBFB0" },
  { nome: "Verde claro", hex: "#8FD694" },
  { nome: "Verde", hex: "#3CB043" },
  { nome: "Verde escuro", hex: "#1F6B2B" },
  { nome: "Amarelo", hex: "#F5D547" },
  { nome: "Dourado", hex: "#D4AF37" },
  { nome: "Laranja", hex: "#F2994A" },
  { nome: "Vermelho", hex: "#E5484D" },
  { nome: "Vinho / Marsala", hex: "#8E3B46" },
  { nome: "Rosa claro", hex: "#F5B8CE" },
  { nome: "Rosa", hex: "#EC6BA5" },
  { nome: "Roxo", hex: "#8B5CF6" },
  { nome: "Lilás", hex: "#C9B6E4" },
  { nome: "Marrom", hex: "#8B5E3C" },
  { nome: "Bege", hex: "#E8DCC8" },
] as const;

interface SeletorCorPaletaProps {
  value: string | null;
  onChange: (hex: string) => void;
}

export function SeletorCorPaleta({ value, onChange }: SeletorCorPaletaProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const handleClickFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberto]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title="Escolher cor"
        aria-label="Escolher cor"
        className="h-8 w-8 rounded-full border-2 border-neutral-light hover:border-magenta transition-colors shrink-0"
        style={{ backgroundColor: value ?? "#e5e5e5" }}
      />
      {aberto && (
        <div className="absolute z-10 top-10 left-0 bg-cream-light border border-neutral-light rounded-xl p-3 shadow-lg w-[216px]">
          <div className="grid grid-cols-6 gap-2">
            {PALETA_HEX.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.nome}
                onClick={() => {
                  onChange(c.hex);
                  setAberto(false);
                }}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  value?.toLowerCase() === c.hex.toLowerCase() ? "border-magenta" : "border-neutral-light/60"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <label className="label-caps text-navy/50 text-[10px] mt-3 flex items-center justify-between cursor-pointer">
            Outra cor
            <input
              type="color"
              value={value ?? "#2A254C"}
              onChange={(e) => {
                onChange(e.target.value);
                setAberto(false);
              }}
              className="h-6 w-8 cursor-pointer"
            />
          </label>
        </div>
      )}
    </div>
  );
}
