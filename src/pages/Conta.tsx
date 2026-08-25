import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";
import type { Order } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusLabel: Record<Order["status"], string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export function Conta() {
  usePageMeta(
    "Minha conta | Sonho e Arte em Dimensões",
    "Gerencie sua conta na Sonho e Arte em Dimensões."
  );

  const { user, profile, signOut, resendConfirmation, updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [mudandoSenha, setMudandoSenha] = useState(false);
  const [statusSenha, setStatusSenha] = useState<"idle" | "loading">("idle");

  const {
    register: registerSenha,
    handleSubmit: handleSubmitSenha,
    reset: resetSenha,
    formState: { errors: erroSenha },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPedidos((data as Order[]) ?? []);
      setCarregandoPedidos(false);
    })();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const emailConfirmado = Boolean(user?.email_confirmed_at);

  const handleReenviarConfirmacao = async () => {
    if (!user?.email) return;
    const { error } = await resendConfirmation(user.email);
    showToast(
      error
        ? { title: "Não foi possível reenviar", description: "Tente novamente em alguns instantes.", variant: "error" }
        : { title: "E-mail de confirmação reenviado", description: "Verifique sua caixa de entrada (e o spam).", variant: "success" }
    );
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-md">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Sua conta</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Minha conta
          </h1>

          <dl className="mt-14 space-y-6">
            <div>
              <dt className="label-caps text-neutral">Nome</dt>
              <dd className="text-navy mt-1">{profile?.nome || "Não informado"}</dd>
            </div>
            <div>
              <dt className="label-caps text-neutral">E-mail</dt>
              <dd className="text-navy mt-1">{user?.email}</dd>
            </div>
          </dl>

          <div className="mt-8">
            {mudandoSenha ? (
              <form
                onSubmit={handleSubmitSenha(async (data) => {
                  setStatusSenha("loading");
                  const { error } = await updatePassword(data.senha);
                  setStatusSenha("idle");

                  if (error) {
                    showToast({ title: "Não foi possível mudar a senha", description: error, variant: "error" });
                    return;
                  }

                  showToast({ title: "Senha atualizada", variant: "success" });
                  resetSenha();
                  setMudandoSenha(false);
                })}
                className="space-y-6"
                noValidate
              >
                <div>
                  <Label htmlFor="senha">Nova senha</Label>
                  <Input id="senha" type="password" {...registerSenha("senha")} />
                  <FieldError message={erroSenha.senha?.message} />
                </div>
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                  <Input id="confirmarSenha" type="password" {...registerSenha("confirmarSenha")} />
                  <FieldError message={erroSenha.confirmarSenha?.message} />
                </div>
                <div className="flex items-center gap-6">
                  <Button type="submit" disabled={statusSenha === "loading"}>
                    {statusSenha === "loading" ? "Salvando..." : "Salvar nova senha"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setMudandoSenha(false);
                      resetSenha();
                    }}
                    className="text-sm text-navy/60 hover:text-navy"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setMudandoSenha(true)} className="text-sm text-magenta hover:underline">
                Quero mudar minha senha
              </button>
            )}
          </div>

          {!emailConfirmado && (
            <div className="mt-8 rounded-xl border border-magenta px-5 py-4">
              <p className="text-sm text-navy">
                Seu e-mail ainda não foi confirmado. Confirme para poder finalizar compras.
              </p>
              <button
                onClick={handleReenviarConfirmacao}
                className="text-sm text-magenta hover:underline mt-2"
              >
                Reenviar e-mail de confirmação
              </button>
            </div>
          )}

          <div className="mt-14">
            <p className="label-caps text-navy/70 mb-4">Meus pedidos</p>
            {carregandoPedidos ? (
              <p className="text-navy/60">Carregando...</p>
            ) : pedidos.length === 0 ? (
              <p className="text-navy/60">Você ainda não fez nenhum pedido.</p>
            ) : (
              <ul className="space-y-3">
                {pedidos.map((pedido) => (
                  <li key={pedido.id}>
                    <Link
                      to={`/pedido/${pedido.id}`}
                      className="flex items-center justify-between gap-4 border border-neutral-light rounded-xl px-5 py-4 hover:border-magenta transition-colors"
                    >
                      <div>
                        <p className="text-navy">Pedido #{pedido.id.slice(0, 8)}</p>
                        <p className="text-sm text-navy/50 mt-1">{statusLabel[pedido.status]}</p>
                      </div>
                      <p className="text-navy shrink-0">{formatarMoeda(pedido.total)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button variant="outline" className="mt-10" onClick={handleSignOut}>
            Sair
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
