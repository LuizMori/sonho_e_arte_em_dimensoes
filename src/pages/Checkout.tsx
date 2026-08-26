import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useCart } from "@/lib/CartProvider";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { enderecoCheckoutSchema, type EnderecoCheckoutFormData } from "@/lib/schemas";
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
  usePageMeta("Checkout | Sonho e Arte em Dimensões", "Calcule o frete, informe o endereço e revise seu pedido.");

  const { items, clear } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  const [cep, setCep] = useState("");
  const [cepErro, setCepErro] = useState<string | undefined>();
  const [calculando, setCalculando] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [erroFrete, setErroFrete] = useState<string | undefined>();
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EnderecoCheckoutFormData>({ resolver: zodResolver(enderecoCheckoutSchema) });

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

  // Autopreenche rua/bairro/cidade/UF a partir do CEP (ViaCEP), assim que o usuário completa 8 dígitos.
  useEffect(() => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    let ativo = true;
    setBuscandoEndereco(true);
    (async () => {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!ativo || data?.erro) return;
        setValue("logradouro", data.logradouro ?? "", { shouldValidate: false });
        setValue("bairro", data.bairro ?? "", { shouldValidate: false });
        setValue("cidade", data.localidade ?? "", { shouldValidate: false });
        setValue("estado", data.uf ?? "", { shouldValidate: false });
      } catch {
        // silencioso: se o ViaCEP falhar, o usuário ainda pode preencher o endereço manualmente
      } finally {
        if (ativo) setBuscandoEndereco(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [cep, setValue]);

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

  const finalizarPedido = async (endereco: EnderecoCheckoutFormData) => {
    if (!frete) return;
    setFinalizando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          itens: items.map((item) => ({
            productId: item.productId,
            quantidade: item.quantidade,
            cor: item.cor,
            variacao: item.variacao,
          })),
          cepDestino: cep.replace(/\D/g, ""),
          freteValor: frete.valor,
          freteNome: `${frete.transportadora} - ${frete.nome}`,
          telefone: endereco.telefone,
          endereco: {
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível criar o pedido");

      clear();
      navigate(`/pedido/${data.orderId}`);
    } catch (err) {
      showToast({
        title: "Não foi possível finalizar o pedido",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setFinalizando(false);
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
          <form onSubmit={handleSubmit(finalizarPedido)} noValidate>
            <Reveal className="space-y-4 mb-14">
              {linhas.map(({ item, produto }) => {
                const detalhe = [item.cor, item.variacao].filter(Boolean).join(" · ");
                return (
                  <div
                    key={`${produto.id}-${item.cor ?? ""}-${item.variacao ?? ""}`}
                    className="flex items-center justify-between border-b border-neutral-light pb-4"
                  >
                    <p className="text-navy">
                      {produto.nome}
                      {detalhe && <span className="text-navy/50"> ({detalhe})</span>}{" "}
                      <span className="text-navy/50">× {item.quantidade}</span>
                    </p>
                    <p className="text-navy">{formatarMoeda(produto.preco * item.quantidade)}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2">
                <span className="label-caps text-navy/70">Subtotal</span>
                <span className="text-navy">{formatarMoeda(subtotal)}</span>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <p className="label-caps text-navy/70 mb-4">Calcular frete</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
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
                <Button type="button" onClick={calcularFrete} disabled={calculando} variant="outline">
                  {calculando ? "Calculando..." : "Calcular"}
                </Button>
              </div>

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

            <Reveal delay={130} className="mt-14">
              <p className="label-caps text-navy/70 mb-1">Endereço de entrega</p>
              <p className="text-sm text-navy/50 mb-6">
                {buscandoEndereco
                  ? "Buscando endereço pelo CEP..."
                  : "Preenchido automaticamente a partir do CEP informado acima — confira e complete."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-6">
                <div>
                  <Label htmlFor="logradouro">Rua / Avenida</Label>
                  <Input id="logradouro" {...register("logradouro")} />
                  <FieldError message={errors.logradouro?.message} />
                </div>
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" {...register("numero")} />
                  <FieldError message={errors.numero?.message} />
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="complemento">Complemento (opcional)</Label>
                <Input id="complemento" placeholder="Apto, bloco, referência..." {...register("complemento")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input id="bairro" {...register("bairro")} />
                  <FieldError message={errors.bairro?.message} />
                </div>
                <div className="grid grid-cols-[1fr_90px] gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" {...register("cidade")} />
                    <FieldError message={errors.cidade?.message} />
                  </div>
                  <div>
                    <Label htmlFor="estado">UF</Label>
                    <Input id="estado" maxLength={2} className="uppercase" {...register("estado")} />
                    <FieldError message={errors.estado?.message} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="telefone">Telefone de contato</Label>
                <Input id="telefone" placeholder="(00) 00000-0000" {...register("telefone")} />
                <FieldError message={errors.telefone?.message} />
              </div>
            </Reveal>

            <Reveal delay={150} className="flex items-center justify-between mt-14 pt-4 border-t border-neutral-light">
              <span className="label-caps text-navy/70">Total</span>
              <span className="font-display text-3xl text-navy">{formatarMoeda(total)}</span>
            </Reveal>

            <Reveal delay={180} className="mt-10">
              {!user ? (
                <>
                  <Link to="/login" state={{ from: { pathname: "/checkout" } }}>
                    <Button type="button" className="w-full sm:w-auto">
                      Fazer login para finalizar
                    </Button>
                  </Link>
                  <p className="text-sm text-navy/50 mt-4">
                    Você precisa estar logado para finalizar o pedido. Seu carrinho fica salvo.
                  </p>
                </>
              ) : (
                <>
                  <Button type="submit" disabled={!frete || finalizando} className="w-full sm:w-auto">
                    {finalizando ? "Finalizando..." : "Finalizar pedido"}
                  </Button>
                  <p className="text-sm text-navy/50 mt-4">
                    {frete
                      ? "O pagamento ainda não está disponível diretamente pelo site — em breve você poderá pagar por aqui. Sua reserva de estoque fica garantida por 30 minutos."
                      : "Calcule o frete acima para finalizar o pedido."}
                  </p>
                  <p className="text-xs text-navy/40 mt-2">
                    Seus dados de entrega são usados apenas para processar este pedido, conforme nossa{" "}
                    <Link to="/privacidade" className="text-navy/60 hover:text-magenta transition-colors">
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </>
              )}
            </Reveal>
          </form>
        )}
      </div>
    </section>
  );
}
