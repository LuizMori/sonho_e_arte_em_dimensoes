import { cn } from "@/lib/utils";

// Composição gráfica própria para o hero, sem uso de fotografia externa.
// Inspirada nas curvas, estrelas e na impressora do logotipo da marca,
// construída inteiramente com formas vetoriais e o gradiente da identidade.
export function HeroArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-full", className)} aria-hidden="true">
      {/* Halo de cor suave, ecoando o gradiente do logotipo */}
      <div
        className="absolute -right-[10%] top-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full opacity-40 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, #E8792F 0%, #C94971 45%, #513A73 75%, transparent 100%)",
        }}
      />

      <svg
        viewBox="0 0 640 640"
        className="relative w-full h-full"
        fill="none"
      >
        <defs>
          <linearGradient id="heroFilament" x1="320" y1="150" x2="320" y2="470" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E8792F" />
            <stop offset="0.55" stopColor="#C94971" />
            <stop offset="1" stopColor="#513A73" />
          </linearGradient>
          <linearGradient id="heroFrame" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F8F3F1" stopOpacity="0.5" />
            <stop offset="1" stopColor="#F8F3F1" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Estrutura da impressora */}
        <path
          d="M210 150h220M210 150v40M430 150v40M210 190h220"
          stroke="url(#heroFrame)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="290" y="188" width="60" height="34" rx="6" stroke="url(#heroFrame)" strokeWidth="3" />

        {/* Filamento descendo até a peça */}
        <path d="M320 222v40" stroke="url(#heroFilament)" strokeWidth="3" strokeLinecap="round" />

        {/* Peça em formação: espiral orgânica, camada sobre camada */}
        <g stroke="url(#heroFilament)" strokeWidth="3" strokeLinecap="round">
          <ellipse cx="320" cy="290" rx="34" ry="14" />
          <ellipse cx="320" cy="316" rx="46" ry="15" />
          <ellipse cx="320" cy="344" rx="40" ry="15" />
          <ellipse cx="320" cy="372" rx="50" ry="16" />
          <ellipse cx="320" cy="401" rx="38" ry="15" />
          <ellipse cx="320" cy="428" rx="48" ry="16" />
          <ellipse cx="320" cy="456" rx="58" ry="17" />
        </g>

        {/* Base */}
        <rect x="252" y="470" width="136" height="10" rx="3" fill="url(#heroFrame)" opacity="0.5" />

        {/* Estrelas soltas, ecoando o logotipo */}
        <path
          d="M470 210l6.4 19.7L496 236l-19.6 6.7L470 262l-6.4-19.3L444 236l19.6-6.3L470 210z"
          stroke="#E8792F"
          strokeWidth="1.6"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <path
          d="M172 340l4.3 13.1L190 358l-13.7 4.4L172 376l-4.3-13.6L154 358l13.7-4.9L172 340z"
          stroke="#C94971"
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity="0.7"
        />
        <path
          d="M500 380l3.4 10.4L514 394l-10.6 3.6L500 408l-3.4-10.4L486 394l10.6-3.6L500 380z"
          stroke="#F1E9E6"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
