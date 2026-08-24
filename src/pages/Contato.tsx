import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { contatoSchema, type ContatoFormData } from "@/lib/schemas";
import { contatoInfo } from "@/data/institucional";

export function Contato() {
  usePageMeta(
    "Contato | Sonho e Arte em Dimensões",
    "Fale com a Sonho e Arte em Dimensões para tirar dúvidas, solicitar informações ou iniciar um projeto de impressão 3D."
  );

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
  });

  const onSubmit = async (data: ContatoFormData) => {
    setStatus("loading");
    try {
      const resposta = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resposta.ok) {
        throw new Error("Falha ao enviar mensagem");
      }

      setStatus("success");
      showToast({
        title: "Mensagem enviada",
        description: "Obrigado pelo contato. Responderemos em breve.",
        variant: "success",
      });
      reset();
    } catch {
      setStatus("error");
      showToast({
        title: "Não foi possível enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "error",
      });
    }
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container grid grid-cols-1 lg:grid-cols-[0.8fr_1fr] gap-12 lg:gap-20">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Fale com a gente</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Contato
          </h1>
          <p className="text-navy/70 text-lg mt-6 leading-relaxed max-w-md">
            Tem uma dúvida antes de solicitar um orçamento? Escreva para a gente.
          </p>

          <dl className="mt-14 space-y-6">
            <div>
              <dt className="label-caps text-neutral">E-mail</dt>
              <dd className="text-navy mt-1">{contatoInfo.email}</dd>
            </div>
            <div>
              <dt className="label-caps text-neutral">WhatsApp</dt>
              <dd className="text-navy mt-1">{contatoInfo.whatsapp}</dd>
            </div>
            <div>
              <dt className="label-caps text-neutral">Redes sociais</dt>
              <dd className="mt-2 flex gap-4">
                {contatoInfo.redesSociais.map((rede) => (
                  <a
                    key={rede.nome}
                    href={rede.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-navy hover:text-magenta transition-colors text-sm"
                  >
                    {rede.nome}
                  </a>
                ))}
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={100}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" placeholder="(00) 00000-0000" {...register("whatsapp")} />
              <FieldError message={errors.whatsapp?.message} />
            </div>

            <div>
              <Label htmlFor="assunto">Assunto</Label>
              <Input id="assunto" placeholder="Sobre o que você quer falar?" {...register("assunto")} />
              <FieldError message={errors.assunto?.message} />
            </div>

            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea id="mensagem" rows={5} placeholder="Escreva sua mensagem" {...register("mensagem")} />
              <FieldError message={errors.mensagem?.message} />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
              {status === "loading" ? "Enviando..." : "Enviar mensagem"}
            </Button>

            <p className="text-xs text-navy/50">
              Ao enviar, você concorda em compartilhar essas informações para que possamos responder seu contato.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
