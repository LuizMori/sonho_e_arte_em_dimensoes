import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthProvider";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas";

export function EsqueciSenha() {
  usePageMeta(
    "Esqueci minha senha | Sonho e Arte em Dimensões",
    "Recupere o acesso à sua conta na Sonho e Arte em Dimensões."
  );

  const { requestPasswordReset } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setStatus("loading");
    await requestPasswordReset(data.email);
    setStatus("success");
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-md">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Recuperar acesso</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Esqueci minha senha
          </h1>

          {status === "success" ? (
            <p className="text-navy/70 text-lg mt-10 leading-relaxed">
              Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha. Verifique
              também a caixa de spam.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-14" noValidate>
              <p className="text-navy/70">
                Informe o e-mail usado no cadastro. Vamos enviar um link para você criar uma nova senha.
              </p>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
          )}

          <p className="text-sm text-center mt-8">
            <Link to="/login" className="text-navy/70 hover:text-magenta transition-colors">
              Voltar para o login
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
