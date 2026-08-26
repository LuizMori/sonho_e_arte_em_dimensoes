import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/CartProvider";
import { supabase } from "@/lib/supabaseClient";
import type { ProdutoComImagens } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Carrinho() {
  usePageMeta("Carrinho | Sonho e Arte em Dimensões", "Revise os itens do seu carrinho de compras.");

  const navigate = useNavigate();
  const { items, updateQuantidade, removeItem } = useCart();
  const [produtos, setProdutos] = useState<ProdutoComImagens[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProdutos([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*)")
        .order("ordem", { referencedTable: "product_images" })
        .in(
          "id",
          items.map((item) => item.productId)
        );
      setProdutos((data as ProdutoComImagens[]) ?? []);
      setCarregando(false);
    })();
  }, [items]);

  const linhas = items
    .map((item) => {
      const produto = produtos.find((p) => p.id === item.productId);
      if (!produto) return null;
      return { item, produto };
    })
    .filter((linha): linha is { item: (typeof items)[number]; produto: ProdutoComImagens } => linha !== null);

  const subtotal = linhas.reduce((total, { item, produto }) => total + produto.preco * item.quantidade, 0);

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-3xl">
        <Reveal className="mb-14">
          <p className="label-caps text-magenta mb-6">Sua seleção</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">Carrinho</h1>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : linhas.length === 0 ? (
          <Reveal>
            <p className="text-navy/60 mb-8">Seu carrinho está vazio.</p>
            <Link to="/portfolio">
              <Button variant="outline">Ver portfólio</Button>
            </Link>
          </Reveal>
        ) : (
          <>
            <div className="space-y-8">
              {linhas.map(({ item, produto }) => {
                const capa = produto.product_images[0];
                return (
                  <Reveal
                    key={`${produto.id}-${item.cor ?? ""}-${item.variacao ?? ""}`}
                    className="flex gap-6 items-center border-b border-neutral-light pb-8"
                  >
                    <Link to={`/portfolio/${produto.slug}`} className="shrink-0 w-24 h-24 bg-neutral-light/40 overflow-hidden">
                      {capa && <img src={capa.url} alt={capa.alt || produto.nome} className="w-full h-full object-cover" />}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/portfolio/${produto.slug}`} className="font-display text-xl text-navy hover:text-magenta transition-colors">
                        {produto.nome}
                      </Link>
                      {(item.cor || item.variacao) && (
                        <p className="text-navy/50 text-sm mt-1">
                          {[item.cor && `Cor: ${item.cor}`, item.variacao && `Variação: ${item.variacao}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-navy/60 mt-1">{formatarMoeda(produto.preco)}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <input
                          type="number"
                          min={1}
                          max={produto.stock}
                          value={item.quantidade}
                          onChange={(e) =>
                            updateQuantidade(
                              produto.id,
                              Math.min(Number(e.target.value), produto.stock),
                              item.cor,
                              item.variacao
                            )
                          }
                          className="w-16 bg-transparent border-b border-neutral-light py-1 text-navy focus:outline-none focus:border-magenta"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(produto.id, item.cor, item.variacao)}
                          className="label-caps text-navy/50 hover:text-magenta transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                    <p className="font-display text-lg text-navy shrink-0">{formatarMoeda(produto.preco * item.quantidade)}</p>
                  </Reveal>
                );
              })}
            </div>

            <Reveal className="flex items-center justify-between mt-10 pt-4">
              <span className="label-caps text-navy/70">Subtotal</span>
              <span className="font-display text-2xl text-navy">{formatarMoeda(subtotal)}</span>
            </Reveal>

            <Reveal className="mt-10">
              <Button onClick={() => navigate("/checkout")} className="w-full sm:w-auto">
                Ir para o checkout
              </Button>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
