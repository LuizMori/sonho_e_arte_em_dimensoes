import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { categorias } from "@/data/categorias";
import type { CustomGalleryItem, ProdutoComImagens } from "@/types";

const SUGESTOES_PERSONALIZADOS = [
  "Brindes empresariais",
  "Brindes comerciais",
  "Placa PET",
  "Logomarca",
];

export function Portfolio() {
  usePageMeta(
    "Portfólio | Sonho e Arte em Dimensões",
    "Explore o portfólio de peças impressas em 3D da Sonho e Arte em Dimensões: decoração, papelaria, presentes, geek e muito mais."
  );

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComImagens[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [galeriaPersonalizados, setGaleriaPersonalizados] = useState<CustomGalleryItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .order("ordem", { referencedTable: "product_images" });
      setProdutos((data as ProdutoComImagens[]) ?? []);
      setCarregando(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("custom_gallery")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      setGaleriaPersonalizados((data as CustomGalleryItem[]) ?? []);
    })();
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (!categoriaAtiva) return produtos;
    return produtos.filter((produto) => produto.categoria === categoriaAtiva);
  }, [categoriaAtiva, produtos]);

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="max-w-2xl mb-12">
          <p className="label-caps text-magenta mb-6">Trabalhos realizados</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy leading-[1.05]">
            Portfólio
          </h1>
        </Reveal>

        <Reveal delay={100} className="mb-16">
          <CategoryFilter categorias={categorias} ativa={categoriaAtiva} onChange={setCategoriaAtiva} />
        </Reveal>

        {categoriaAtiva === "personalizados" && (
          <Reveal className="mb-16 rounded-2xl border border-neutral-light bg-cream-light/60 p-8 md:p-10">
            <p className="label-caps text-magenta mb-3">Sob encomenda</p>
            <h2 className="font-display text-2xl md:text-3xl text-navy tracking-tightest mb-4 max-w-xl">
              Não encontrou o que procura? Criamos peças personalizadas para você.
            </h2>
            <p className="text-navy/70 mb-6 max-w-2xl">
              Conte sua ideia e a gente dá forma a ela. Alguns exemplos do que já produzimos sob medida:
            </p>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 mb-8">
              {SUGESTOES_PERSONALIZADOS.map((sugestao) => (
                <li key={sugestao} className="label-caps text-navy/60">
                  {sugestao}
                </li>
              ))}
            </ul>
            <Link to="/orcamento">
              <Button>Solicitar orçamento</Button>
            </Link>

            {galeriaPersonalizados.length > 0 && (
              <div className="mt-10 pt-8 border-t border-neutral-light/70">
                <p className="label-caps text-navy/50 mb-4">Já produzimos</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galeriaPersonalizados.map((item) => (
                    <div key={item.id}>
                      <div className="aspect-square overflow-hidden rounded-lg">
                        <img
                          src={item.imagem_url}
                          alt={item.descricao ?? "Peça personalizada já produzida"}
                          loading="lazy"
                          className="w-full h-full object-cover img-hover"
                        />
                      </div>
                      {item.descricao && (
                        <p className="text-navy/60 text-sm mt-2">{item.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        )}

        {categoriaAtiva !== "personalizados" &&
          (carregando ? (
            <p className="text-navy/60">Carregando...</p>
          ) : produtosFiltrados.length === 0 ? (
            <p className="text-navy/60">Nenhuma peça encontrada nesta categoria no momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {produtosFiltrados.map((produto, index) => {
                const categoria = categorias.find((c) => c.slug === produto.categoria);
                const capa = produto.product_images[0];
                return (
                  <Reveal key={produto.slug} delay={(index % 6) * 60}>
                    <ProjectCard
                      to={`/portfolio/${produto.slug}`}
                      nome={produto.nome}
                      categoriaNome={categoria?.nome}
                      imagemUrl={capa?.url}
                      imagemAlt={capa?.alt || produto.nome}
                    />
                  </Reveal>
                );
              })}
            </div>
          ))}
      </div>
    </section>
  );
}
