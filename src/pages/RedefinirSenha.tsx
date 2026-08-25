import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthProvider";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas";

export function RedefinirSenha() {
  usePageMeta(
    "Redefinir senha | Sonho e Arte em Dimensões",
    "Crie uma nova senha para sua conta na Sonho e Arte em Dimensões."
  );

  const { updatePassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setStatus("loading");
    const { error } = await updatePassword(data.senha);
    setStatus("idle");

    if (error) {
      showToast({
        title: "Não foi possível redefinir a senha",
        description: "O link pode ter expirado. Solicite um novo e tente novamente.",
        variant: "error",
      });
      return;
    }

    showToast({
      title: "Senha redefinida",
      description: "Sua senha foi atualizada com sucesso.",
      variant: "success",
    });
    navigate("/conta", { replace: true });
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-md">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Nova senha</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Redefinir senha
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-14" noValidate>
            <div>
              <Label htmlFor="senha">Nova senha</Label>
              <Input id="senha" type="password" placeholder="Crie uma nova senha" {...register("senha")} />
              <FieldError message={errors.senha?.message} />
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a nova senha"
                {...register("confirmarSenha")}
              />
              <FieldError message={errors.confirmarSenha?.message} />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
