import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { SeletorCorPaleta, PALETA_HEX } from "@/components/admin/SeletorCorPaleta";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Color } from "@/types";

export function AdminCores() {
  usePageMeta("Cores | Admin | Sonho e Arte em Dimensões", "Gerencie a paleta de cores disponível para os produtos.");

  const { showToast } = useToast();
  const [cores, setCores] = useState<Color[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeNovaCor, setNomeNovaCor] = useState("");
  const [hexNovaCor, setHexNovaCor] = useState<string>(PALETA_HEX[0].hex);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase.from("colors").select("*").order("nome", { ascending: true });
    setCores((data as Color[]) ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const adicionarCor = async (event: FormEvent) => {
    event.preventDefault();
    const nome = nomeNovaCor.trim();
    if (!nome) return;

    setSalvando(true);
    const { error } = await supabase.from("colors").insert({ nome, hex: hexNovaCor });
    setSalvando(false);

    if (error) {
      const description = error.code === "23505" ? "Essa cor já existe na paleta." : error.message;
      showToast({ title: "Não foi possível adicionar a cor", description, variant: "error" });
      return;
    }

    setNomeNovaCor("");
    showToast({ title: "Cor adicionada", variant: "success" });
    carregar();
  };

  const atualizarHex = async (cor: Color, hex: string) => {
    if (hex === cor.hex) return;
    const hexAnterior = cor.hex;
    setCores((prev) => prev.map((c) => (c.id === cor.id ? { ...c, hex } : c)));

    // .select() depois do update é o que permite perceber um bloqueio de RLS: sem
    // permissão, o update roda "com sucesso" mas não afeta nenhuma linha (error fica nulo,
    // data vem vazio) — só assim dá pra distinguir de um update que realmente funcionou.
    const { data, error } = await supabase.from("colors").update({ hex }).eq("id", cor.id).select().maybeSingle();
    if (error || !data) {
      setCores((prev) => prev.map((c) => (c.id === cor.id ? { ...c, hex: hexAnterior } : c)));
      showToast({
        title: "Não foi possível salvar a cor",
        description: error?.message,
        variant: "error",
      });
      return;
    }
    showToast({ title: "Cor atualizada", variant: "success" });
  };

  const removerCor = async (cor: Color) => {
    if (
      !window.confirm(
        `Remover a cor "${cor.nome}"? Ela será removida de todos os produtos que a usam atualmente.`
      )
    )
      return;

    const { error } = await supabase.from("colors").delete().eq("id", cor.id);
    if (error) {
      showToast({ title: "Não foi possível remover a cor", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Cores
          </h1>
          <p className="text-sm text-navy/50 mt-4">
            Essa paleta é usada no cadastro de produtos e na página do produto, onde o cliente escolhe a
            cor antes de comprar.
          </p>
        </Reveal>

        <AdminNav />

        <Reveal className="border border-neutral-light rounded-xl px-6 py-6 mb-16">
          <p className="label-caps text-navy/70 mb-4">Adicionar cor</p>
          <form onSubmit={adicionarCor} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="nomeNovaCor">Nome da cor</Label>
              <Input
                id="nomeNovaCor"
                value={nomeNovaCor}
                onChange={(e) => setNomeNovaCor(e.target.value)}
                placeholder="Ex: Verde-água"
              />
            </div>
            <div>
              <Label htmlFor="hexNovaCor">Cor</Label>
              <div className="h-11 flex items-center">
                <SeletorCorPaleta value={hexNovaCor} onChange={setHexNovaCor} />
              </div>
            </div>
            <Button type="submit" disabled={!nomeNovaCor.trim() || salvando}>
              {salvando ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : cores.length === 0 ? (
          <p className="text-navy/50 text-sm">Nenhuma cor cadastrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {cores.map((cor) => (
              <li
                key={cor.id}
                className="flex items-center justify-between border-b border-neutral-light/60 pb-3"
              >
                <div className="flex items-center gap-3">
                  <SeletorCorPaleta value={cor.hex} onChange={(hex) => atualizarHex(cor, hex)} />
                  <span className="text-navy">{cor.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removerCor(cor)}
                  className="label-caps text-navy/50 hover:text-magenta transition-colors"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
