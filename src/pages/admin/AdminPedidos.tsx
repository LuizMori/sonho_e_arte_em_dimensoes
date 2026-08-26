import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { OrderComRelacoes, OrderStatus } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = (data: string) => new Date(data).toLocaleString("pt-BR");

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

const statusCor: Record<OrderStatus, string> = {
  pending_payment: "text-orange",
  paid: "text-emerald-700",
  shipped: "text-navy",
  cancelled: "text-magenta",
  expired: "text-neutral",
};

export function AdminPedidos() {
  usePageMeta("Pedidos | Admin | Sonho e Arte em Dimensões", "Histórico de pedidos da loja.");

  const [pedidos, setPedidos] = useState<OrderComRelacoes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<OrderStatus | "todos">("todos");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, profiles(nome), order_items(*, products(nome, slug))")
        .order("created_at", { ascending: false });
      setPedidos((data as OrderComRelacoes[]) ?? []);
      setCarregando(false);
    })();
  }, []);

  const pedidosFiltrados = useMemo(
    () => (filtro === "todos" ? pedidos : pedidos.filter((p) => p.status === filtro)),
    [pedidos, filtro]
  );

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <p className="label-caps text-magenta mb-6">Painel admin</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
              Pedidos
            </h1>
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as OrderStatus | "todos")}
            className="label-caps bg-transparent border-b border-neutral-light py-2 text-navy focus:outline-none focus:border-magenta"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(statusLabel).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </Reveal>

        <AdminNav />

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="text-navy/60">Nenhum pedido encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left label-caps text-navy/50 border-b border-neutral-light">
                  <th className="pb-4 pr-4">Cliente</th>
                  <th className="pb-4 pr-4">Produtos</th>
                  <th className="pb-4 pr-4">Total</th>
                  <th className="pb-4 pr-4">Status</th>
                  <th className="pb-4">Data</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="border-b border-neutral-light/60 align-top">
                    <td className="py-4 pr-4 text-navy">
                      {pedido.profiles?.nome || "Cliente"}
                      <p className="text-navy/40 text-xs mt-1">#{pedido.id.slice(0, 8)}</p>
                    </td>
                    <td className="py-4 pr-4 text-navy/80">
                      {pedido.order_items
                        .map((item) => {
                          const detalhe = [item.cor, item.variacao].filter(Boolean).join(" · ");
                          return `${item.quantidade}× ${item.products?.nome ?? item.nome_produto ?? "Produto removido"}${
                            detalhe ? ` (${detalhe})` : ""
                          }`;
                        })
                        .join(", ")}
                    </td>
                    <td className="py-4 pr-4 text-navy whitespace-nowrap">{formatarMoeda(pedido.total)}</td>
                    <td className={`py-4 pr-4 whitespace-nowrap ${statusCor[pedido.status]}`}>
                      {statusLabel[pedido.status]}
                    </td>
                    <td className="py-4 text-navy/60 whitespace-nowrap">{formatarData(pedido.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
