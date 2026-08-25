import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Quote } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { depoimentoSchema, type DepoimentoFormData } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types";

function Estrelas({ nota }: { nota: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={n <= nota ? "fill-orange text-orange" : "text-neutral-light"}
        />
      ))}
    </div>
  );
}

function SeletorEstrelas({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className="p-1"
        >
          <Star
            size={24}
            className={cn(
              "transition-colors",
              n <= value ? "fill-orange text-orange" : "text-neutral-light hover:text-orange/50"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { showToast } = useToast();
  const [depoimentos, setDepoimentos] = useState<Testimonial[]>([]);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DepoimentoFormData>({
    resolver: zodResolver(depoimentoSchema),
    defaultValues: { nome: "", texto: "", nota: 0 },
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("aprovado", true)
        .order("created_at", { ascending: false });
      setDepoimentos((data as Testimonial[]) ?? []);
    })();
  }, []);

  const onSubmit = async (data: DepoimentoFormData) => {
    setStatus("loading");
    const { error } = await supabase.from("testimonials").insert({
      tipo: "texto",
      nome_cliente: data.nome,
      texto: data.texto,
      nota: data.nota,
      aprovado: false,
    });
    setStatus("idle");

    if (error) {
      showToast({ title: "Não foi possível enviar", description: error.message, variant: "error" });
      return;
    }

    setEnviado(true);
    reset({ nome: "", texto: "", nota: 0 });
    showToast({
      title: "Obrigado pelo depoimento!",
      description: "Ele será publicado assim que for aprovado.",
      variant: "success",
    });
  };

  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <Reveal className="max-w-xl mb-16">
          <SectionTitle label="Quem já viveu" title="O que nossos clientes dizem" />
        </Reveal>

        {depoimentos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {depoimentos.map((depoimento, index) => (
              <Reveal key={depoimento.id} delay={index * 70}>
                {depoimento.tipo === "print" && depoimento.imagem_url ? (
                  <div>
                    <img
                      src={depoimento.imagem_url}
                      alt={`Print de feedback de ${depoimento.nome_cliente}`}
                      loading="lazy"
                      className="w-full rounded-xl border border-neutral-light"
                    />
                    <p className="label-caps text-navy/60 mt-4">{depoimento.nome_cliente}</p>
                  </div>
                ) : (
                  <div className="h-full border border-neutral-light rounded-xl p-7 flex flex-col bg-white/50">
                    <Quote size={22} className="text-orange/70 mb-4" />
                    {depoimento.nota !== null && <Estrelas nota={depoimento.nota} />}
                    <p className="text-navy/80 leading-relaxed mt-4 flex-1">"{depoimento.texto}"</p>
                    <p className="label-caps text-navy/50 mt-6">{depoimento.nome_cliente}</p>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        )}

        <Reveal className="max-w-lg">
          <p className="label-caps text-navy/70 mb-6">Deixe seu depoimento</p>

          {enviado ? (
            <p className="text-navy/70">
              Recebemos seu depoimento e ele será publicado assim que for aprovado. Obrigado!
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div>
                <Label htmlFor="nome">Seu nome</Label>
                <Input id="nome" {...register("nome")} />
                <FieldError message={errors.nome?.message} />
              </div>

              <div>
                <Label htmlFor="texto">Seu depoimento</Label>
                <Textarea id="texto" rows={4} {...register("texto")} />
                <FieldError message={errors.texto?.message} />
              </div>

              <div>
                <Label htmlFor="nota">Sua nota</Label>
                <Controller
                  name="nota"
                  control={control}
                  render={({ field }) => (
                    <SeletorEstrelas value={field.value} onChange={field.onChange} />
                  )}
                />
                <FieldError message={errors.nota?.message} />
              </div>

              <Button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Enviando..." : "Enviar depoimento"}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
