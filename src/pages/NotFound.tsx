import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Button } from "@/components/ui/Button";

export function NotFound() {
  usePageMeta(
    "Página não encontrada | Sonho e Arte em Dimensões",
    "A página que você procura não foi encontrada."
  );

  return (
    <section className="pt-40 pb-32 md:pt-56 md:pb-48 text-center">
      <div className="container">
        <p className="label-caps text-magenta mb-6">404</p>
        <h1 className="font-display text-4xl sm:text-6xl tracking-tightest text-navy">
          Esta página não foi encontrada.
        </h1>
        <p className="text-navy/70 mt-6">Talvez o caminho tenha mudado de dimensão.</p>
        <Link to="/" className="inline-block mt-10">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </section>
  );
}
