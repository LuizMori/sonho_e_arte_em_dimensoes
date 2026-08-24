import { cn } from "@/lib/utils";

// Elementos gráficos decorativos inspirados nas curvas, estrelas e formas
// tridimensionais do logotipo. Usados com moderação como detalhe visual.

export function DecorStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("w-6 h-6", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 2l3.6 11.1L35 17l-11.4 3.9L20 32l-3.6-11.1L5 17l11.4-3.9L20 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DecorCurve({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      className={cn("w-full h-auto", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 60c40 40 100 40 140 0s100-40 140 0 76 40 116 0"
        stroke="url(#curveGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="curveGradient" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#513A73" />
          <stop offset="0.5" stopColor="#C94971" />
          <stop offset="1" stopColor="#E8792F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function DecorArc({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("w-full h-full", className)}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="url(#arcGradient)"
        strokeWidth="1.2"
        strokeDasharray="4 10"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="arcGradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#513A73" />
          <stop offset="1" stopColor="#E8792F" />
        </linearGradient>
      </defs>
    </svg>
  );
}
