import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/lib/CartProvider";
import { useAuth } from "@/lib/AuthProvider";
import { categorias } from "@/data/categorias";
import { avisoEstoqueSchema, type AvisoEstoqueFormData } from "@/lib/schemas";
import type { ProdutoComImagens } from "@/types";

function AvisoEstoque({ produtoId }: { produtoId: string }) {
  const { user } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AvisoEstoqueFormData>({
    resolver: zodResolver(avisoEstoqueSchema),
    defaultValues: { email: user?.email ?? "" },
  });

  if (enviado) {
    return (
      <p className="text-navy/70">Vamos te avisar por e-mail assim que este produto voltar ao estoque!</p>
    );
  }

  const onSubmit = async (data: AvisoEstoqueFormData) => {
    setStatus("loading");
    const { error } = await supabase
      .from("stock_notifications")
      .insert({ product_id: produtoId, email: data.email });
    setStatus("idle");

    if (error) {
      if (error.code === "23505") {
        setEnviado(true);
        return;
      }
      return;
    }

    setEnviado(true);
  };

  return (
    <div>
      <p className="text-navy/60 mb-4">Sem estoque no momento. Quer ser avisado quando chegar?</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
        <div>
          <Label htmlFor="email-aviso">E-mail</Label>
          <Input id="email-aviso" type="email" placeholder="seu@email.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <Button type="submit" variant="outline" disabled={status === "loading"}>
          {status === "loading" ? "Enviando..." : "Avisar quando chegar"}
        </Button>
      </form>
    </div>
  );
}

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [produto, setProduto] = useState<ProdutoComImagens | null | undefined>(undefined);
  const [proximo, setProximo] = useState<{ slug: string; nome: string } | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const { items, addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    setProduto(undefined);
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("slug", slug)
        .eq("ativo", true)
        .order("ordem", { referencedTable: "product_images" })
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

      <section className="pt-8 pb-16 md:pb-20">
        <div className="container">
          <Reveal className="mb-8">
            <h1 className="font-display text-4xl sm:text-5xl tracking-tightest text-navy leading-[1.05]">
              {produto.nome}
            </h1>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-12 lg:gap-16 items-start">
            <div>
              {produto.product_images.length > 0 && (
                <ProductCarousel
                  imagens={produto.product_images.map((imagem) => ({ url: imagem.url, alt: imagem.alt }))}
                  nomeProduto={produto.nome}
                />
              )}
            </div>

            <Reveal>
              <p className="text-navy/80 text-lg leading-relaxed font-display font-light whitespace-pre-line">
                {produto.descricao}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container">
          <Reveal>
            <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-8 gap-y-6 border-y border-neutral-light py-8">
              {metadados.map((item) => (
                <div key={item.label}>
                  <dt className="label-caps text-neutral">{item.label}</dt>
                  <dd className="text-navy text-lg mt-1">{item.valor}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="max-w-xs mt-10">
            {(() => {
              const jaNoCarrinho = items.find((item) => item.productId === produto.id)?.quantidade ?? 0;
              const restante = Math.max(0, produto.stock - jaNoCarrinho);

              if (produto.stock === 0) {
                return <AvisoEstoque produtoId={produto.id} />;
              }

              if (restante === 0) {
                return <p className="text-navy/60">Todo o estoque disponível já está no seu carrinho.</p>;
              }

              return (
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <input
                      id="quantidade"
                      type="number"
                      min={1}
                      max={restante}
                      value={Math.min(quantidade, restante)}
                      onChange={(e) => setQuantidade(Math.max(1, Math.min(Number(e.target.value), restante)))}
                      className="w-16 bg-transparent border-b border-neutral-light py-1 text-navy focus:outline-none focus:border-magenta"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      const quantidadeValida = Math.max(1, Math.min(quantidade, restante));
                      addItem(produto.id, quantidadeValida);
                      showToast({ title: "Adicionado ao carrinho", description: produto.nome, variant: "success" });
                      setQuantidade(1);
                    }}
                  >
                    Adicionar ao carrinho
                  </Button>
                </div>
              );
            })()}
          </Reveal>
        </div>
      </section>

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
