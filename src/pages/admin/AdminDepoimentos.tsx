import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Star } from "lucide-react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadTestimonialImage } from "@/lib/storage";
import type { Testimonial } from "@/types";

export function AdminDepoimentos() {
  usePageMeta("Depoimentos | Admin | Sonho e Arte em Dimensões", "Modere depoimentos e publique prints de feedback.");

  const { showToast } = useToast();
  const [depoimentos, setDepoimentos] = useState<Testimonial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomePrint, setNomePrint] = useState("");
  const [enviandoPrint, setEnviandoPrint] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    setDepoimentos((data as Testimonial[]) ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const pendentes = depoimentos.filter((d) => !d.aprovado);
  const publicados = depoimentos.filter((d) => d.aprovado);

  const aprovar = async (id: string) => {
    const { error } = await supabase.from("testimonials").update({ aprovado: true }).eq("id", id);
    if (error) {
      showToast({ title: "Não foi possível aprovar", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  const remover = async (id: string) => {
    if (!window.confirm("Remover este depoimento? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) {
      showToast({ title: "Não foi possível remover", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  const publicarPrint = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo || !nomePrint.trim()) {
      showToast({ title: "Informe o nome do cliente antes de escolher a imagem", variant: "error" });
      event.target.value = "";
      return;
    }

    setEnviandoPrint(true);
    try {
      const url = await uploadTestimonialImage(arquivo);
      const { error } = await supabase.from("testimonials").insert({
        tipo: "print",
        nome_cliente: nomePrint.trim(),
        imagem_url: url,
        aprovado: true,
      });
      if (error) throw error;

      setNomePrint("");
      showToast({ title: "Print publicado", variant: "success" });
      carregar();
    } catch {
      showToast({ title: "Não foi possível publicar o print", variant: "error" });
    } finally {
      setEnviandoPrint(false);
      event.target.value = "";
    }
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-3xl">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Depoimentos
          </h1>
        </Reveal>

        <AdminNav />

        <Reveal className="border border-neutral-light rounded-xl px-6 py-6 mb-16">
          <p className="label-caps text-navy/70 mb-4">Publicar print de feedback</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="nomePrint">Nome do cliente</Label>
              <Input
                id="nomePrint"
                value={nomePrint}
                onChange={(e) => setNomePrint(e.target.value)}
                placeholder="Ex: Mariana S."
              />
            </div>
            <label className="label-caps inline-flex items-center rounded-full border border-navy text-navy px-6 py-3 cursor-pointer hover:border-magenta hover:text-magenta transition-colors shrink-0">
              {enviandoPrint ? "Enviando..." : "Escolher imagem"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={publicarPrint}
                disabled={enviandoPrint}
              />
            </label>
          </div>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : (
          <>
            <Reveal className="mb-16">
              <p className="label-caps text-navy/70 mb-4">Pendentes de aprovação ({pendentes.length})</p>
              {pendentes.length === 0 ? (
                <p className="text-navy/50 text-sm">Nenhum depoimento pendente.</p>
              ) : (
                <div className="space-y-4">
                  {pendentes.map((d) => (
                    <div key={d.id} className="border border-neutral-light rounded-xl px-6 py-5">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-navy font-medium">{d.nome_cliente}</p>
                        {d.nota !== null && (
                          <div className="flex gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={14}
                                className={n <= d.nota! ? "fill-orange text-orange" : "text-neutral-light"}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-navy/70 text-sm leading-relaxed">{d.texto}</p>
                      <div className="flex items-center gap-5 mt-4">
                        <button
                          onClick={() => aprovar(d.id)}
                          className="label-caps text-navy/70 hover:text-navy transition-colors"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => remover(d.id)}
                          className="label-caps text-navy/70 hover:text-magenta transition-colors"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>

            <Reveal>
              <p className="label-caps text-navy/70 mb-4">Publicados ({publicados.length})</p>
              {publicados.length === 0 ? (
                <p className="text-navy/50 text-sm">Nenhum depoimento publicado ainda.</p>
              ) : (
                <div className="space-y-4">
                  {publicados.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-6 border-b border-neutral-light py-4"
                    >
                      <div>
                        <p className="text-navy">{d.nome_cliente}</p>
                        <p className="text-navy/50 text-sm mt-1">
                          {d.tipo === "print" ? "Print de feedback" : d.texto}
                        </p>
                      </div>
                      <button
                        onClick={() => remover(d.id)}
                        className="label-caps text-navy/70 hover:text-magenta transition-colors shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
