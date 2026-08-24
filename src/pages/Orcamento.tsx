import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { orcamentoSchema, type OrcamentoFormData } from "@/lib/schemas";

const tiposProjeto = [
  "Decoração",
  "Peça personalizada",
  "Protótipo",
  "Miniatura ou colecionável",
  "Utilidade doméstica",
  "Presente personalizado",
  "Outro",
];

export function Orcamento() {
  usePageMeta(
    "Solicitar orçamento | Sonho e Arte em Dimensões",
    "Solicite um orçamento para impressão 3D de peças personalizadas, decoração, miniaturas, protótipos e objetos funcionais."
  );

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      possuiArquivo: "nao",
    },
  });

  const onSubmit = async (data: OrcamentoFormData) => {
    setStatus("loading");
    try {
      // Envio simulado. Para conectar a um backend real, substitua o bloco
      // abaixo por uma chamada de API, por exemplo:
      // await fetch("/api/orcamento", { method: "POST", body: formData });
      await new Promise((resolve) => setTimeout(resolve, 900));
      console.log("Solicitação de orçamento (simulada):", data);

      setStatus("success");
      showToast({
        title: "Solicitação enviada",
        description: "Recebemos seu pedido de orçamento e entraremos em contato em breve.",
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
          <p className="label-caps text-magenta mb-6">Vamos começar</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Solicitar orçamento
          </h1>
          <p className="text-navy/70 text-lg mt-6 leading-relaxed max-w-md">
            Preencha o formulário com o máximo de detalhes que puder. Você não precisa ter conhecimento técnico
            sobre impressão 3D, nem possuir um arquivo 3D pronto, para solicitar um orçamento.
          </p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tipoProjeto">Tipo de projeto</Label>
                <Select id="tipoProjeto" defaultValue="" {...register("tipoProjeto")}>
                  <option value="" disabled>
                    Selecione uma opção
                  </option>
                  {tiposProjeto.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.tipoProjeto?.message} />
              </div>
              <div>
                <Label htmlFor="quantidade">Quantidade</Label>
                <Input id="quantidade" placeholder="Ex: 1 unidade" {...register("quantidade")} />
                <FieldError message={errors.quantidade?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="material">Material desejado</Label>
                <Input id="material" placeholder="Ex: PLA, ainda não sei" {...register("material")} />
                <FieldError message={errors.material?.message} />
              </div>
              <div>
                <Label htmlFor="cor">Cor</Label>
                <Input id="cor" placeholder="Ex: roxo, ainda não sei" {...register("cor")} />
                <FieldError message={errors.cor?.message} />
              </div>
              <div>
                <Label htmlFor="tamanho">Tamanho aproximado</Label>
                <Input id="tamanho" placeholder="Ex: 15 cm de altura" {...register("tamanho")} />
                <FieldError message={errors.tamanho?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="possuiArquivo">Possui arquivo 3D?</Label>
              <Select id="possuiArquivo" {...register("possuiArquivo")}>
                <option value="nao">Não, preciso de ajuda com o modelo</option>
                <option value="sim">Sim, já tenho o arquivo</option>
              </Select>
              <FieldError message={errors.possuiArquivo?.message} />
            </div>

            <div>
              <Label htmlFor="arquivo">Upload do arquivo (opcional)</Label>
              <input
                id="arquivo"
                type="file"
                accept=".stl,.obj,.3mf,image/*"
                className="w-full text-sm text-navy/70 file:mr-4 file:label-caps file:rounded-full file:border-0 file:bg-navy file:text-cream-light file:px-5 file:py-2.5 file:cursor-pointer"
                {...register("arquivo")}
              />
              <p className="text-xs text-navy/50 mt-2">
                Aceita arquivos 3D (.stl, .obj, .3mf) ou imagens de referência.
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={4}
                placeholder="Conte mais detalhes sobre a peça que você imagina"
                {...register("observacoes")}
              />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
              {status === "loading" ? "Enviando..." : "Enviar solicitação"}
            </Button>

            <p className="text-xs text-navy/50">
              Este formulário simula o envio da solicitação. Nenhuma informação é transmitida a um servidor no
              momento.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
