import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Gallery } from "@/components/Gallery";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { categorias } from "@/data/categorias";
import type { ProdutoComImagens } from "@/types";

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [produto, setProduto] = useState<ProdutoComImagens | null | undefined>(undefined);
  const [proximo, setProximo] = useState<{ slug: string; nome: string } | null>(null);

  useEffect(() => {
    setProduto(undefined);
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("slug", slug)
        .eq("ativo", true)
        .maybeSingle();
      setProduto((data as ProdutoComImagens) ?? null);
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("slug, nome")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (!data || data.length <= 1) {
        setProximo(null);
        return;
      }
      const index = data.findIndex((p) => p.slug === slug);
      const proximoProduto = index >= 0 ? data[(index + 1) % data.length] : null;
      setProximo(proximoProduto);
    })();
  }, [slug]);

  usePageMeta(
    produto ? `${produto.nome} | Portfólio | Sonho e Arte em Dimensões` : "Portfólio | Sonho e Arte em Dimensões",
    produto?.descricao ?? "Portfólio de peças da Sonho e Arte em Dimensões."
  );

  if (produto === null) {
    return <Navigate to="/portfolio" replace />;
  }

  if (produto === undefined) {
    return (
      <section className="pt-40 pb-24 md:pt-48 md:pb-32">
        <div className="container">
          <p className="text-navy/60">Carregando...</p>
        </div>
      </section>
    );
  }

  const categoria = categorias.find((c) => c.slug === produto.categoria);
  const [capa, ...galeria] = produto.product_images;

  const metadados = [
    { label: "Categoria", valor: categoria?.nome ?? "" },
    { label: "Preço", valor: produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    { label: "Peso", valor: `${produto.peso_kg} kg` },
    {
      label: "Dimensões",
      valor: `${produto.altura_cm} × ${produto.largura_cm} × ${produto.comprimento_cm} cm`,
    },
    { label: "Disponibilidade", valor: produto.stock > 0 ? `${produto.stock} em estoque` : "Sem estoque" },
  ];

  return (
    <>
      <section className="pt-32 md:pt-36">
        <div className="container">
          <Reveal>
            <Link to="/portfolio" className="label-caps text-navy/60 hover:text-magenta transition-colors">
              Voltar ao portfólio
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="pt-8 pb-16 md:pb-24">
        <div className="container">
          <Reveal className="mb-8">
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-tightest text-navy leading-[1.02] max-w-3xl">
              {produto.nome}
            </h1>
          </Reveal>
          {capa && (
            <Reveal delay={100}>
              <img
                src={capa.url}
                alt={capa.alt || produto.nome}
                className="w-full h-auto max-h-[80vh] object-cover"
              />
            </Reveal>
          )}
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container grid grid-cols-1 lg:grid-cols-[0.7fr_1fr] gap-12 lg:gap-24">
          <Reveal>
            <dl className="space-y-6 lg:sticky lg:top-32">
              {metadados.map((item) => (
                <div key={item.label} className="border-b border-neutral-light pb-4">
                  <dt className="label-caps text-neutral">{item.label}</dt>
                  <dd className="text-navy text-lg mt-1">{item.valor}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div>
            <Reveal>
              <p className="text-navy/80 text-lg sm:text-xl leading-relaxed font-display font-light whitespace-pre-line">
                {produto.descricao}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {galeria.length > 0 && (
        <section className="pb-24 md:pb-32">
          <div className="container">
            <Gallery imagens={galeria.map((imagem) => ({ url: imagem.url, alt: imagem.alt || produto.nome }))} />
          </div>
        </section>
      )}

      <section className="py-24 md:py-32 bg-navy text-cream-light text-center">
        <Reveal className="container max-w-xl mx-auto">
          <p className="font-display text-3xl sm:text-4xl tracking-tightest leading-[1.15]">
            Gostou desta peça? Fale com a gente para comprar ou personalizar.
          </p>
          <div className="mt-10">
            <Link to="/orcamento">
              <Button className="bg-orange text-cream-light hover:bg-magenta">Solicitar orçamento</Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {proximo && (
        <section className="py-16 md:py-20 border-t border-neutral-light">
          <div className="container">
            <Link to={`/portfolio/${proximo.slug}`} className="group flex items-center justify-between gap-6">
              <div>
                <p className="label-caps text-neutral mb-2">Próxima peça</p>
                <p className="font-display text-3xl sm:text-4xl text-navy group-hover:text-magenta transition-colors">
                  {proximo.nome}
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
