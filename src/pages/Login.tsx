import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthProvider";
import { loginSchema, type LoginFormData } from "@/lib/schemas";

export function Login() {
  usePageMeta(
    "Entrar | Sonho e Arte em Dimensões",
    "Acesse sua conta para acompanhar seus pedidos na Sonho e Arte em Dimensões."
  );

  const { signIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setStatus("loading");
    const { error } = await signIn(data.email, data.senha);
    setStatus("idle");

    if (error) {
      showToast({
        title: "Não foi possível entrar",
        description: "Verifique seu e-mail e senha e tente novamente.",
        variant: "error",
      });
      return;
    }

    const state = location.state as { from?: { pathname: string } } | null;
    navigate(state?.from?.pathname ?? "/conta", { replace: true });
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-md">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Bem-vindo de volta</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Entrar
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-14" noValidate>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="Sua senha" {...register("senha")} />
              <FieldError message={errors.senha?.message} />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Entrando..." : "Entrar"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link to="/esqueci-senha" className="text-navy/70 hover:text-magenta transition-colors">
                Esqueci minha senha
              </Link>
              <Link to="/cadastro" className="text-navy/70 hover:text-magenta transition-colors">
                Criar conta
              </Link>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
