import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderItemComProduto } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel: Record<Order["status"], string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export function Pedido() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  usePageMeta("Pedido | Sonho e Arte em Dimensões", "Acompanhe os detalhes do seu pedido.");

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [itens, setItens] = useState<OrderItemComProduto[]>([]);
  const [pagando, setPagando] = useState(false);

  const buscarPedido = async () => {
    if (!orderId) return;
    const [{ data: pedido }, { data: itensPedido }] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
      supabase.from("order_items").select("*, products(nome, slug)").eq("order_id", orderId),
    ]);
    setOrder((pedido as Order) ?? null);
    setItens((itensPedido as OrderItemComProduto[]) ?? []);
    return pedido as Order | null;
  };

  useEffect(() => {
    buscarPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const sincronizarPagamento = async () => {
    if (!orderId) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      await fetch("/api/mercadopago/sync-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId }),
      });
    } catch {
      // silencioso: é só uma tentativa periódica de sincronização, o webhook continua sendo a via principal
    }
    await buscarPedido();
  };

  useEffect(() => {
    if (order?.status !== "pending_payment") return;

    sincronizarPagamento();
    const intervalo = setInterval(() => {
      sincronizarPagamento();
    }, 5000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, orderId]);

  const iniciarPagamento = async () => {
    if (!order) return;
    setPagando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível iniciar o pagamento");

      window.open(data.initPoint, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast({
        title: "Não foi possível iniciar o pagamento",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setPagando(false);
    }
  };

  if (order === null) {
    return <Navigate to="/conta" replace />;
  }

  if (order === undefined) {
    return (
      <section className="pt-40 pb-24 md:pt-48 md:pb-32">
        <div className="container">
          <p className="text-navy/60">Carregando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal className="mb-14">
          <p className="label-caps text-magenta mb-6">Pedido</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tightest text-navy leading-[1.05]">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="label-caps text-navy/60 mt-4">{statusLabel[order.status]}</p>
        </Reveal>

        <Reveal className="space-y-4 mb-10">
          {itens.map((item) => {
            const detalhe = [item.cor, item.variacao].filter(Boolean).join(" · ");
            return (
              <div key={item.id} className="flex items-center justify-between border-b border-neutral-light pb-4">
                <p className="text-navy">
                  {item.products?.nome ?? item.nome_produto ?? "Produto"}
                  {detalhe && <span className="text-navy/50"> ({detalhe})</span>}{" "}
                  <span className="text-navy/50">× {item.quantidade}</span>
                </p>
                <p className="text-navy">{formatarMoeda(item.preco_unitario * item.quantidade)}</p>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2">
            <span className="label-caps text-navy/70">Subtotal</span>
            <span className="text-navy">{formatarMoeda(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="label-caps text-navy/70">Frete</span>
            <span className="text-navy">{formatarMoeda(order.frete_valor)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-neutral-light">
            <span className="label-caps text-navy/70">Total</span>
            <span className="font-display text-2xl text-navy">{formatarMoeda(order.total)}</span>
          </div>
        </Reveal>

        <Reveal className="mb-10">
          <p className="label-caps text-navy/70 mb-4">Endereço de entrega</p>
          <p className="text-navy/80 leading-relaxed">
            {order.endereco_json.logradouro ? (
              <>
                {order.endereco_json.logradouro}, {order.endereco_json.numero}
                {order.endereco_json.complemento ? ` — ${order.endereco_json.complemento}` : ""}
                <br />
                {order.endereco_json.bairro} — {order.endereco_json.cidade}/{order.endereco_json.estado}
                <br />
                CEP {order.cep_destino}
              </>
            ) : (
              <>CEP {order.cep_destino}</>
            )}
            {order.telefone && (
              <>
                <br />
                Telefone: {order.telefone}
              </>
            )}
          </p>
        </Reveal>

        {order.status === "pending_payment" && (
          <Reveal className="bg-cream-light border border-neutral-light rounded-xl px-6 py-5 mb-10">
            {order.reserved_until && (
              <p className="text-navy mb-4">
                Sua reserva de estoque expira em{" "}
                <strong>{new Date(order.reserved_until).toLocaleString("pt-BR")}</strong>. Pague antes desse
                horário para garantir seu pedido.
              </p>
            )}
            <Button onClick={iniciarPagamento} disabled={pagando} className="w-full sm:w-auto">
              {pagando ? "Abrindo..." : "Pagar agora"}
            </Button>
            <p className="text-sm text-navy/50 mt-4">
              O pagamento abre em uma nova aba pelo Mercado Pago. Depois de pagar, pode voltar para esta
              página — ela atualiza sozinha assim que a confirmação chegar.
            </p>
          </Reveal>
        )}

        {searchParams.get("status") === "approved" && order.status === "pending_payment" && (
          <Reveal className="mb-10">
            <p className="text-navy/60">
              Estamos confirmando seu pagamento com o Mercado Pago, isso pode levar alguns segundos...
            </p>
          </Reveal>
        )}

        <Reveal>
          <Link to="/portfolio">
            <Button variant="outline">Continuar navegando</Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
