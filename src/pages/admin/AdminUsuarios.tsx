import { useEffect, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { supabase } from "@/lib/supabaseClient";
import type { Order, OrderStatus, Profile } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

interface UsuarioComPedidos extends Profile {
  orders: Order[];
}

export function AdminUsuarios() {
  usePageMeta("Usuários | Admin | Sonho e Arte em Dimensões", "Usuários cadastrados na loja e seus pedidos.");

  const [usuarios, setUsuarios] = useState<UsuarioComPedidos[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, orders(*)")
        .order("created_at", { ascending: true });
      setUsuarios((data as UsuarioComPedidos[]) ?? []);
      setCarregando(false);
    })();
  }, []);

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Usuários
          </h1>
        </Reveal>

        <AdminNav />

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-navy/60">Nenhum usuário cadastrado ainda.</p>
        ) : (
          <ol className="space-y-6">
            {usuarios.map((usuario, index) => (
              <li key={usuario.id} className="flex items-start gap-4 border-b border-neutral-light pb-6">
                <span className="label-caps text-navy/40 shrink-0 w-6 pt-0.5">{index + 1}.</span>
                <div className="flex-1">
                  <p className="text-navy">{usuario.nome || "Sem nome"}</p>
                  <p className="text-navy/60 text-sm mt-0.5">{usuario.email}</p>

                  {usuario.orders.length === 0 ? (
                    <p className="text-navy/40 text-sm mt-3">Nenhum pedido</p>
                  ) : (
                    <ul className="mt-3 space-y-1.5">
                      {[...usuario.orders]
                        .sort((a, b) => b.created_at.localeCompare(a.created_at))
                        .map((pedido) => (
                          <li key={pedido.id} className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-navy/70">#{pedido.id.slice(0, 8)}</span>
                            <span className={statusCor[pedido.status]}>{statusLabel[pedido.status]}</span>
                            <span className="text-navy/70 shrink-0">{formatarMoeda(pedido.total)}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
