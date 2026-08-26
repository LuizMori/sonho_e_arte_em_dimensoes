import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadCustomGalleryImage } from "@/lib/storage";
import type { CustomGalleryItem } from "@/types";

export function AdminGaleriaPersonalizados() {
  usePageMeta(
    "Galeria de personalizados | Admin | Sonho e Arte em Dimensões",
    "Publique fotos de peças personalizadas já realizadas."
  );

  const { showToast } = useToast();
  const [itens, setItens] = useState<CustomGalleryItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("custom_gallery")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });
    setItens((data as CustomGalleryItem[]) ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const selecionarArquivo = (event: ChangeEvent<HTMLInputElement>) => {
    const selecionado = event.target.files?.[0];
    if (!selecionado) return;
    setArquivo(selecionado);
    setPreviewUrl(URL.createObjectURL(selecionado));
  };

  const cancelarSelecao = () => {
    setArquivo(null);
    setPreviewUrl(null);
  };

  const publicarFoto = async () => {
    if (!arquivo) return;

    setEnviando(true);
    try {
      const url = await uploadCustomGalleryImage(arquivo);
      const { error } = await supabase.from("custom_gallery").insert({
        imagem_url: url,
        descricao: descricao.trim() || null,
      });
      if (error) throw error;

      setDescricao("");
      cancelarSelecao();
      showToast({ title: "Foto publicada na galeria", variant: "success" });
      carregar();
    } catch {
      showToast({ title: "Não foi possível publicar a foto", variant: "error" });
    } finally {
      setEnviando(false);
    }
  };

  const remover = async (id: string) => {
    if (!window.confirm("Remover esta foto da galeria? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("custom_gallery").delete().eq("id", id);
    if (error) {
      showToast({ title: "Não foi possível remover", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-3xl">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Galeria de personalizados
          </h1>
        </Reveal>

        <AdminNav />

        <Reveal className="border border-neutral-light rounded-xl px-6 py-6 mb-16">
          <p className="label-caps text-navy/70 mb-4">Publicar foto</p>

          {previewUrl && (
            <div className="flex items-center gap-4 mb-5">
              <img src={previewUrl} alt="Pré-visualização" className="w-20 h-20 object-cover rounded-lg" />
              <button
                type="button"
                onClick={cancelarSelecao}
                className="label-caps text-navy/60 hover:text-magenta transition-colors"
              >
                Remover seleção
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="descricaoFoto">Descrição (opcional)</Label>
              <Input
                id="descricaoFoto"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Placa PET personalizada"
              />
            </div>
            <label className="label-caps inline-flex items-center rounded-full border border-navy text-navy px-6 py-3 cursor-pointer hover:border-magenta hover:text-magenta transition-colors shrink-0">
              {arquivo ? "Trocar imagem" : "Escolher imagem"}
              <input type="file" accept="image/*" className="hidden" onChange={selecionarArquivo} disabled={enviando} />
            </label>
            <Button type="button" onClick={publicarFoto} disabled={!arquivo || enviando}>
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : itens.length === 0 ? (
          <p className="text-navy/50 text-sm">Nenhuma foto publicada ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {itens.map((item) => (
              <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl">
                <img
                  src={item.imagem_url}
                  alt={item.descricao ?? "Peça personalizada"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
                  {item.descricao && <p className="text-cream-light text-sm">{item.descricao}</p>}
                  <button
                    onClick={() => remover(item.id)}
                    className="label-caps text-cream-light hover:text-magenta transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
