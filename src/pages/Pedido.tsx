import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
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
  usePageMeta("Pedido | Sonho e Arte em Dimensões", "Acompanhe os detalhes do seu pedido.");

  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [itens, setItens] = useState<OrderItemComProduto[]>([]);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      const [{ data: pedido }, { data: itensPedido }] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase.from("order_items").select("*, products(nome, slug)").eq("order_id", orderId),
      ]);
      setOrder((pedido as Order) ?? null);
      setItens((itensPedido as OrderItemComProduto[]) ?? []);
    })();
  }, [orderId]);

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
          <p className="label-caps text-magenta mb-6">Pedido confirmado</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tightest text-navy leading-[1.05]">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="label-caps text-navy/60 mt-4">{statusLabel[order.status]}</p>
        </Reveal>

        <Reveal className="space-y-4 mb-10">
          {itens.map((item) => (
            <div key={item.id} className="flex items-center justify-between border-b border-neutral-light pb-4">
              <p className="text-navy">
                {item.products?.nome ?? "Produto"} <span className="text-navy/50">× {item.quantidade}</span>
              </p>
              <p className="text-navy">{formatarMoeda(item.preco_unitario * item.quantidade)}</p>
            </div>
          ))}
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

        {order.status === "pending_payment" && order.reserved_until && (
          <Reveal className="bg-cream-light border border-neutral-light rounded-xl px-6 py-5 mb-10">
            <p className="text-navy">
              Sua reserva de estoque expira em{" "}
              <strong>{new Date(order.reserved_until).toLocaleString("pt-BR")}</strong>. O pagamento ainda não está
              disponível diretamente pelo site — em breve você poderá concluir por aqui.
            </p>
            <Link to="/contato" className="text-magenta label-caps inline-block mt-4">
              Falar com a gente para confirmar o pagamento
            </Link>
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
