import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/AuthProvider";
import { signupSchema, type SignupFormData } from "@/lib/schemas";

export function Cadastro() {
  usePageMeta(
    "Criar conta | Sonho e Arte em Dimensões",
    "Crie sua conta para comprar peças do catálogo da Sonho e Arte em Dimensões."
  );

  const { signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (data: SignupFormData) => {
    setStatus("loading");
    const { error } = await signUp(data.email, data.senha, data.nome);
    setStatus("idle");

    if (error) {
      showToast({
        title: "Não foi possível criar sua conta",
        description: error.includes("already registered") ? "Este e-mail já está cadastrado." : "Tente novamente em alguns instantes.",
        variant: "error",
      });
      return;
    }

    showToast({
      title: "Cadastro realizado",
      description: "Enviamos um link de confirmação para o seu e-mail. Confirme para poder finalizar compras.",
      variant: "success",
    });
    navigate("/login", { replace: true });
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-md">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Bem-vindo</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Criar conta
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-14" noValidate>
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Seu nome completo" {...register("nome")} />
              <FieldError message={errors.nome?.message} />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" placeholder="Crie uma senha" {...register("senha")} />
              <FieldError message={errors.senha?.message} />
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                type="password"
                placeholder="Repita a senha"
                {...register("confirmarSenha")}
              />
              <FieldError message={errors.confirmarSenha?.message} />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full">
              {status === "loading" ? "Criando conta..." : "Criar conta"}
            </Button>

            <p className="text-sm text-center">
              <span className="text-navy/70">Já tem uma conta? </span>
              <Link to="/login" className="text-navy hover:text-magenta transition-colors">
                Entrar
              </Link>
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
