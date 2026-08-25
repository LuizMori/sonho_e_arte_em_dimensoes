import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { useCart } from "@/lib/CartProvider";
import { supabase } from "@/lib/supabaseClient";
import type { Produto } from "@/types";

interface OpcaoFrete {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number;
}

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Checkout() {
  usePageMeta("Checkout | Sonho e Arte em Dimensões", "Calcule o frete e revise seu pedido.");

  const { items } = useCart();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [cep, setCep] = useState("");
  const [cepErro, setCepErro] = useState<string | undefined>();
  const [calculando, setCalculando] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [erroFrete, setErroFrete] = useState<string | undefined>();

  useEffect(() => {
    if (items.length === 0) {
      setProdutos([]);
      setCarregando(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .in(
          "id",
          items.map((item) => item.productId)
        );
      setProdutos((data as Produto[]) ?? []);
      setCarregando(false);
    })();
  }, [items]);

  const linhas = items
    .map((item) => {
      const produto = produtos.find((p) => p.id === item.productId);
      if (!produto) return null;
      return { item, produto };
    })
    .filter((linha): linha is { item: (typeof items)[number]; produto: Produto } => linha !== null);

  const subtotal = linhas.reduce((total, { item, produto }) => total + produto.preco * item.quantidade, 0);
  const frete = opcaoSelecionada ? opcoes?.find((o) => o.id === opcaoSelecionada) : undefined;
  const total = subtotal + (frete?.valor ?? 0);

  const calcularFrete = async (event: FormEvent) => {
    event.preventDefault();
    const cepLimpo = cep.replace(/\D/g, "");
    if (!/^\d{8}$/.test(cepLimpo)) {
      setCepErro("Informe um CEP válido com 8 dígitos");
      return;
    }
    setCepErro(undefined);
    setErroFrete(undefined);
    setOpcoes(null);
    setOpcaoSelecionada(null);
    setCalculando(true);

    try {
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cepDestino: cepLimpo,
          itens: items.map((item) => ({ productId: item.productId, quantidade: item.quantidade })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível calcular o frete");
      }
      setOpcoes(data.opcoes ?? []);
      if (data.opcoes?.length > 0) {
        setOpcaoSelecionada(data.opcoes[0].id);
      }
    } catch {
      setErroFrete("Não foi possível calcular o frete no momento. Tente novamente em instantes.");
    } finally {
      setCalculando(false);
    }
  };

  if (!carregando && items.length === 0) {
    return <Navigate to="/carrinho" replace />;
  }

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal className="mb-14">
          <p className="label-caps text-magenta mb-6">Revisão do pedido</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">Checkout</h1>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : (
          <>
            <Reveal className="space-y-4 mb-14">
              {linhas.map(({ item, produto }) => (
                <div key={produto.id} className="flex items-center justify-between border-b border-neutral-light pb-4">
                  <p className="text-navy">
                    {produto.nome} <span className="text-navy/50">× {item.quantidade}</span>
                  </p>
                  <p className="text-navy">{formatarMoeda(produto.preco * item.quantidade)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="label-caps text-navy/70">Subtotal</span>
                <span className="text-navy">{formatarMoeda(subtotal)}</span>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <p className="label-caps text-navy/70 mb-4">Calcular frete</p>
              <form onSubmit={calcularFrete} className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="cep">CEP de destino</Label>
                  <Input
                    id="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <FieldError message={cepErro} />
                </div>
                <Button type="submit" disabled={calculando} variant="outline">
                  {calculando ? "Calculando..." : "Calcular"}
                </Button>
              </form>

              {erroFrete && <p className="mt-4 text-sm text-magenta">{erroFrete}</p>}

              {opcoes && opcoes.length === 0 && !erroFrete && (
                <p className="mt-4 text-navy/60">Nenhuma opção de frete disponível para este CEP.</p>
              )}

              {opcoes && opcoes.length > 0 && (
                <div className="mt-6 space-y-3">
                  {opcoes.map((opcao) => (
                    <label
                      key={opcao.id}
                      className="flex items-center justify-between gap-4 border border-neutral-light rounded-xl px-5 py-4 cursor-pointer has-[:checked]:border-magenta"
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="frete"
                          checked={opcaoSelecionada === opcao.id}
                          onChange={() => setOpcaoSelecionada(opcao.id)}
                        />
                        <div>
                          <p className="text-navy">
                            {opcao.transportadora} — {opcao.nome}
                          </p>
                          <p className="text-navy/50 text-sm">Prazo estimado: {opcao.prazoDias} dias úteis</p>
                        </div>
                      </div>
                      <p className="text-navy font-display text-lg shrink-0">{formatarMoeda(opcao.valor)}</p>
                    </label>
                  ))}
                </div>
              )}
            </Reveal>

            <Reveal delay={150} className="flex items-center justify-between mt-14 pt-4 border-t border-neutral-light">
              <span className="label-caps text-navy/70">Total</span>
              <span className="font-display text-3xl text-navy">{formatarMoeda(total)}</span>
            </Reveal>

            <Reveal delay={180} className="mt-10">
              <Button disabled className="w-full sm:w-auto">
                Finalizar pedido (em breve)
              </Button>
              <p className="text-sm text-navy/50 mt-4">
                O pagamento ainda não está disponível — em breve você poderá concluir a compra por aqui.
                Para comprar agora,{" "}
                <Link to="/contato" className="text-magenta">
                  fale com a gente
                </Link>
                .
              </p>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
