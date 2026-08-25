import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthProvider";

export function Conta() {
  usePageMeta(
    "Minha conta | Sonho e Arte em Dimensões",
    "Gerencie sua conta na Sonho e Arte em Dimensões."
  );

  const { user, profile, signOut, resendConfirmation } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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

          <Button variant="outline" className="mt-10" onClick={handleSignOut}>
            Sair
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
