import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadCharmImage } from "@/lib/storage";
import { baixarCsv } from "@/lib/csv";
import { COLUNAS_PINGENTE_CSV } from "@/data/charmCsvColunas";
import type { Charm, Color } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AdminPingentes() {
  usePageMeta("Pingentes | Admin | Sonho e Arte em Dimensões", "Gerencie o catálogo de pingentes da Charm Mania.");

  const { showToast } = useToast();
  const [pingentes, setPingentes] = useState<Charm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [paletaCores, setPaletaCores] = useState<Color[]>([]);
  const [coresNovoPingente, setCoresNovoPingente] = useState<string[]>([]);
  const [pingenteExpandido, setPingenteExpandido] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const [{ data }, { data: cores }] = await Promise.all([
      supabase.from("charms").select("*, charm_colors(color_id, colors(id, nome, hex))").order("nome", { ascending: true }),
      supabase.from("colors").select("*").order("nome", { ascending: true }),
    ]);
    setPingentes((data as Charm[]) ?? []);
    setPaletaCores((cores as Color[]) ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const alternarCorNovoPingente = (colorId: string) => {
    setCoresNovoPingente((prev) => (prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]));
  };

  const alternarCorPingenteExistente = async (pingente: Charm, colorId: string) => {
    const jaTem = (pingente.charm_colors ?? []).some((cc) => cc.color_id === colorId);
    if (jaTem) {
      const { error } = await supabase.from("charm_colors").delete().eq("charm_id", pingente.id).eq("color_id", colorId);
      if (error) {
        showToast({ title: "Não foi possível remover a cor", description: error.message, variant: "error" });
        return;
      }
    } else {
      const { error } = await supabase.from("charm_colors").insert({ charm_id: pingente.id, color_id: colorId });
      if (error) {
        showToast({ title: "Não foi possível adicionar a cor", description: error.message, variant: "error" });
        return;
      }
    }
    carregar();
  };

  const handleArquivo = (event: ChangeEvent<HTMLInputElement>) => {
    setArquivo(event.target.files?.[0] ?? null);
  };

  const adicionarPingente = async (event: FormEvent) => {
    event.preventDefault();
    const nomeTrim = nome.trim();
    const precoNum = Number(preco);
    const estoqueNum = Number(estoque);
    if (!nomeTrim || !preco || Number.isNaN(precoNum) || precoNum < 0) return;

    setSalvando(true);
    try {
      const imagem_url = arquivo ? await uploadCharmImage(arquivo) : null;
      const { data: novoPingente, error } = await supabase
        .from("charms")
        .insert({
          nome: nomeTrim,
          preco: precoNum,
          estoque: Number.isNaN(estoqueNum) ? 0 : estoqueNum,
          imagem_url,
        })
        .select()
        .single();

      if (error || !novoPingente) {
        const description = error?.code === "23505" ? "Esse pingente já existe no catálogo." : error?.message;
        showToast({ title: "Não foi possível adicionar o pingente", description, variant: "error" });
        return;
      }

      if (coresNovoPingente.length > 0) {
        await supabase
          .from("charm_colors")
          .insert(coresNovoPingente.map((colorId) => ({ charm_id: novoPingente.id, color_id: colorId })));
      }

      setNome("");
      setPreco("");
      setEstoque("");
      setArquivo(null);
      setCoresNovoPingente([]);
      showToast({ title: "Pingente adicionado", variant: "success" });
      carregar();
    } catch {
      showToast({ title: "Não foi possível enviar a imagem do pingente", variant: "error" });
    } finally {
      setSalvando(false);
    }
  };

  const exportarCsv = () => {
    const linhas = pingentes.map((p) => [
      p.nome,
      String(p.preco),
      String(p.estoque),
      "",
      (p.charm_colors ?? []).map((cc) => cc.colors.nome).join(";"),
    ]);
    baixarCsv("pingentes.csv", [...COLUNAS_PINGENTE_CSV], linhas);
  };

  const atualizarCampo = async (pingente: Charm, campo: "preco" | "estoque", valor: number) => {
    if (Number.isNaN(valor) || valor < 0) return;
    await supabase.from("charms").update({ [campo]: valor }).eq("id", pingente.id);
    setPingentes((prev) => prev.map((p) => (p.id === pingente.id ? { ...p, [campo]: valor } : p)));
  };

  const removerPingente = async (pingente: Charm) => {
    if (
      !window.confirm(
        `Remover o pingente "${pingente.nome}"? Ele deixará de aparecer no montador da Charm Mania. Pedidos já feitos com ele continuam intactos.`
      )
    )
      return;

    const { error } = await supabase.from("charms").delete().eq("id", pingente.id);
    if (error) {
      showToast({ title: "Não foi possível remover o pingente", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal className="flex flex-wrap items-start justify-between gap-6 mb-12">
          <div>
            <p className="label-caps text-magenta mb-6">Painel admin</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
              Pingentes
            </h1>
            <p className="text-sm text-navy/50 mt-4">
              Catálogo de pingentes usado no montador da Charm Mania, com preço e estoque próprios de cada um.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {pingentes.length > 0 && (
              <Button type="button" variant="outline" onClick={exportarCsv}>
                Exportar CSV
              </Button>
            )}
            <Link to="/admin/pingentes/importar">
              <Button variant="outline">Importar CSV</Button>
            </Link>
          </div>
        </Reveal>

        <AdminNav />

        <Reveal className="border border-neutral-light rounded-xl px-6 py-6 mb-16">
          <p className="label-caps text-navy/70 mb-4">Adicionar pingente</p>
          <form onSubmit={adicionarPingente} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nomePingente">Nome</Label>
                <Input id="nomePingente" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Coração" />
              </div>
              <div>
                <Label htmlFor="precoPingente">Preço (R$)</Label>
                <Input
                  id="precoPingente"
                  type="number"
                  step="0.01"
                  min="0"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estoquePingente">Estoque</Label>
                <Input
                  id="estoquePingente"
                  type="number"
                  step="1"
                  min="0"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                />
              </div>
            </div>
            {paletaCores.length > 0 && (
              <div>
                <p className="label-caps text-navy/70 mb-2">Cores disponíveis (opcional)</p>
                <div className="flex flex-wrap gap-3">
                  {paletaCores.map((cor) => {
                    const selecionada = coresNovoPingente.includes(cor.id);
                    return (
                      <button
                        key={cor.id}
                        type="button"
                        onClick={() => alternarCorNovoPingente(cor.id)}
                        className={`label-caps rounded-full border px-4 py-2 transition-colors ${
                          selecionada
                            ? "border-magenta text-magenta"
                            : "border-neutral-light text-navy/70 hover:border-magenta hover:text-magenta"
                        }`}
                      >
                        {cor.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="imagemPingente">Foto (opcional)</Label>
                <input
                  id="imagemPingente"
                  type="file"
                  accept="image/*"
                  onChange={handleArquivo}
                  className="text-sm text-navy/70"
                />
              </div>
              <Button type="submit" disabled={!nome.trim() || !preco || salvando}>
                {salvando ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </form>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : pingentes.length === 0 ? (
          <p className="text-navy/50 text-sm">Nenhum pingente cadastrado ainda.</p>
        ) : (
          <ul className="space-y-4">
            {pingentes.map((pingente) => (
              <li key={pingente.id} className="border-b border-neutral-light/60 pb-4">
              <div className="flex items-center gap-4">
                {pingente.imagem_url ? (
                  <img
                    src={pingente.imagem_url}
                    alt={pingente.nome}
                    className="w-12 h-12 object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-neutral-light/40 shrink-0" />
                )}
                <span className="text-navy flex-1 min-w-[100px]">{pingente.nome}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={pingente.preco}
                  onBlur={(e) => atualizarCampo(pingente, "preco", Number(e.target.value))}
                  className="w-24 bg-transparent border-b border-neutral-light py-1 text-navy text-sm focus:outline-none focus:border-magenta"
                  aria-label={`Preço de ${pingente.nome}`}
                />
                <input
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={pingente.estoque}
                  onBlur={(e) => atualizarCampo(pingente, "estoque", Number(e.target.value))}
                  className="w-20 bg-transparent border-b border-neutral-light py-1 text-navy text-sm focus:outline-none focus:border-magenta"
                  aria-label={`Estoque de ${pingente.nome}`}
                />
                <span className="text-navy/40 text-xs w-24 shrink-0 hidden sm:inline">
                  {formatarMoeda(pingente.preco)} · {pingente.estoque} un.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPingenteExpandido((prev) => (prev === pingente.id ? null : pingente.id))
                  }
                  className="label-caps text-navy/50 hover:text-magenta transition-colors shrink-0"
                >
                  Cores
                </button>
                <button
                  type="button"
                  onClick={() => removerPingente(pingente)}
                  className="label-caps text-navy/50 hover:text-magenta transition-colors shrink-0"
                >
                  Remover
                </button>
              </div>
              {pingenteExpandido === pingente.id && (
                <div className="mt-4 pl-16">
                  {paletaCores.length === 0 ? (
                    <p className="text-sm text-navy/50">
                      Nenhuma cor cadastrada ainda. Gerencie a paleta em{" "}
                      <a href="/admin/cores" className="text-navy hover:text-magenta transition-colors">
                        Cores
                      </a>
                      .
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {paletaCores.map((cor) => {
                        const selecionada = (pingente.charm_colors ?? []).some((cc) => cc.color_id === cor.id);
                        return (
                          <button
                            key={cor.id}
                            type="button"
                            onClick={() => alternarCorPingenteExistente(pingente, cor.id)}
                            className={`label-caps rounded-full border px-4 py-2 transition-colors ${
                              selecionada
                                ? "border-magenta text-magenta"
                                : "border-neutral-light text-navy/70 hover:border-magenta hover:text-magenta"
                            }`}
                          >
                            {cor.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
