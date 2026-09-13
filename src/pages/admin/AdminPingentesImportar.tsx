import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadCharmImage } from "@/lib/storage";
import { parseCsv, linhasParaObjetos, paraLinhaCsv } from "@/lib/csv";
import { COLUNAS_PINGENTE_CSV } from "@/data/charmCsvColunas";
import type { Color } from "@/types";

const COLUNAS = COLUNAS_PINGENTE_CSV;

interface LinhaImportacao {
  numero: number;
  bruto: Record<string, string>;
  erros: string[];
  dados?: {
    nome: string;
    preco: number;
    estoque: number;
    imagem_url: string;
    cores: string[];
  };
}

function paraNumero(valor: string): number | null {
  const normalizado = valor.trim().replace(",", ".");
  if (normalizado === "") return null;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function validarLinha(bruto: Record<string, string>, numero: number): LinhaImportacao {
  const erros: string[] = [];

  const nome = bruto.nome?.trim() ?? "";
  if (nome.length < 2) erros.push("nome é obrigatório");

  const preco = paraNumero(bruto.preco ?? "");
  if (preco === null || preco < 0) erros.push("preco inválido");

  const estoqueValor = bruto.estoque?.trim() ?? "";
  const estoque = estoqueValor === "" ? 0 : paraNumero(estoqueValor);
  if (estoque === null || estoque < 0 || !Number.isInteger(estoque)) erros.push("estoque inválido");

  const cores = (bruto.cores ?? "")
    .split(";")
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0);

  if (erros.length > 0) {
    return { numero, bruto, erros };
  }

  return {
    numero,
    bruto,
    erros: [],
    dados: {
      nome,
      preco: preco as number,
      estoque: estoque as number,
      imagem_url: bruto.imagem_url?.trim() ?? "",
      cores,
    },
  };
}

export function AdminPingentesImportar() {
  usePageMeta("Importar pingentes | Admin | Sonho e Arte em Dimensões", "Importe pingentes em lote via arquivo CSV.");

  const { showToast } = useToast();
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<{
    criados: number;
    atualizados: number;
    ocorrencias: string[];
  } | null>(null);

  const validas = linhas.filter((l) => l.dados);
  const invalidas = linhas.filter((l) => !l.dados);

  const handleArquivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setResultado(null);
    setNomeArquivo(arquivo.name);

    const texto = await arquivo.text();
    const linhasCsv = parseCsv(texto);
    const objetos = linhasParaObjetos(linhasCsv);

    if (objetos.length === 0) {
      showToast({ title: "Arquivo vazio", description: "Nenhuma linha de pingente encontrada.", variant: "error" });
      setLinhas([]);
      return;
    }

    setLinhas(objetos.map((obj, index) => validarLinha(obj, index + 2)));
    event.target.value = "";
  };

  const baixarModelo = () => {
    const exemplo = ["Coração", "2.00", "10", "", "Rosa claro;Vermelho"];
    const conteudo = [paraLinhaCsv([...COLUNAS]), paraLinhaCsv(exemplo)].join("\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-pingentes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importar = async () => {
    if (validas.length === 0) return;
    setImportando(true);
    setProgresso({ atual: 0, total: validas.length });

    const { data: paleta } = await supabase.from("colors").select("*");
    const paletaCores = (paleta as Color[]) ?? [];

    let criados = 0;
    let atualizados = 0;
    const ocorrencias: string[] = [];

    for (let i = 0; i < validas.length; i++) {
      const { dados } = validas[i];
      if (!dados) continue;
      setProgresso({ atual: i + 1, total: validas.length });

      const { data: existente } = await supabase
        .from("charms")
        .select("id")
        .ilike("nome", dados.nome)
        .maybeSingle();

      let imagemUrl: string | null = null;
      if (dados.imagem_url) {
        try {
          const resposta = await fetch(dados.imagem_url);
          if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
          const blob = await resposta.blob();
          const extensao = dados.imagem_url.split(".").pop()?.split("?")[0] || "jpg";
          const arquivo = new File([blob], `pingente.${extensao}`, { type: blob.type || "image/jpeg" });
          imagemUrl = await uploadCharmImage(arquivo);
        } catch (err) {
          ocorrencias.push(
            `${dados.nome}: falha ao importar imagem (${dados.imagem_url}) — ${err instanceof Error ? err.message : "erro desconhecido"}`
          );
        }
      }

      const payload = {
        nome: dados.nome,
        preco: dados.preco,
        estoque: dados.estoque,
        ...(imagemUrl ? { imagem_url: imagemUrl } : {}),
      };

      let pingenteId: string | null = null;

      if (existente) {
        const { error } = await supabase.from("charms").update(payload).eq("id", existente.id);
        if (error) {
          ocorrencias.push(`${dados.nome}: não foi possível atualizar (${error.message})`);
          continue;
        }
        pingenteId = existente.id;
        atualizados++;
      } else {
        const { data: novo, error } = await supabase
          .from("charms")
          .insert(payload)
          .select()
          .single();
        if (error || !novo) {
          ocorrencias.push(`${dados.nome}: não foi possível criar (${error?.message ?? "erro desconhecido"})`);
          continue;
        }
        pingenteId = novo.id;
        criados++;
      }

      if (!pingenteId) continue;

      if (dados.cores.length > 0) {
        const idsEncontrados = new Set<string>();
        for (const nomeCor of dados.cores) {
          const cor = paletaCores.find((c) => c.nome.toLowerCase() === nomeCor.toLowerCase());
          if (cor) {
            idsEncontrados.add(cor.id);
          } else {
            ocorrencias.push(`${dados.nome}: cor "${nomeCor}" não existe na paleta, ignorada`);
          }
        }
        await supabase.from("charm_colors").delete().eq("charm_id", pingenteId);
        if (idsEncontrados.size > 0) {
          const { error: erroCores } = await supabase
            .from("charm_colors")
            .insert(Array.from(idsEncontrados).map((colorId) => ({ charm_id: pingenteId, color_id: colorId })));
          if (erroCores) {
            ocorrencias.push(`${dados.nome}: não foi possível salvar as cores (${erroCores.message})`);
          }
        }
      }
    }

    setImportando(false);
    setProgresso(null);
    setResultado({ criados, atualizados, ocorrencias });
    setLinhas([]);
    showToast({
      title: "Importação concluída",
      description: `${criados} criado(s), ${atualizados} atualizado(s).`,
      variant: "success",
    });
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <p className="label-caps text-magenta mb-6">Painel admin</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
              Importar pingentes
            </h1>
          </div>
          <Link to="/admin/pingentes">
            <Button variant="outline">Voltar para pingentes</Button>
          </Link>
        </Reveal>

        <AdminNav />

        <Reveal className="max-w-2xl">
          <p className="text-navy/70 leading-relaxed">
            Envie um arquivo CSV para cadastrar ou atualizar vários pingentes de uma vez. Se já existir um
            pingente com o mesmo <code className="text-navy">nome</code>, ele é atualizado em vez de
            duplicado. A coluna <code className="text-navy">imagem_url</code> é opcional e aceita uma URL de
            imagem, que é baixada e enviada automaticamente. A coluna{" "}
            <code className="text-navy">cores</code> é opcional e aceita nomes de cores já cadastradas em{" "}
            <code className="text-navy">/admin/cores</code>, separados por <code className="text-navy">;</code>{" "}
            (ex: "Rosa claro;Vermelho") — nomes que não existem na paleta são ignorados.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Button type="button" variant="outline" onClick={baixarModelo}>
              Baixar modelo CSV
            </Button>
            <label className="label-caps inline-flex items-center rounded-full border border-navy text-navy px-6 py-3 cursor-pointer hover:border-magenta hover:text-magenta transition-colors">
              Escolher arquivo CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleArquivo} />
            </label>
          </div>
          {nomeArquivo && <p className="text-sm text-navy/50 mt-4">Arquivo carregado: {nomeArquivo}</p>}
        </Reveal>

        {linhas.length > 0 && (
          <Reveal className="mt-14">
            <p className="label-caps text-navy/70 mb-4">
              {validas.length} linha(s) válida(s) · {invalidas.length} linha(s) com erro
            </p>

            <div className="overflow-x-auto border border-neutral-light rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-cream-light">
                  <tr>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Linha</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Nome</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Preço</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Estoque</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.numero} className="border-t border-neutral-light">
                      <td className="px-4 py-3 text-navy/60">{linha.numero}</td>
                      <td className="px-4 py-3 text-navy">{linha.bruto.nome || "—"}</td>
                      <td className="px-4 py-3 text-navy/70">{linha.bruto.preco || "—"}</td>
                      <td className="px-4 py-3 text-navy/70">{linha.bruto.estoque || "—"}</td>
                      <td className="px-4 py-3">
                        {linha.dados ? (
                          <span className="text-emerald-700">Ok</span>
                        ) : (
                          <span className="text-magenta">{linha.erros.join("; ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              onClick={importar}
              disabled={validas.length === 0 || importando}
              className="mt-8"
            >
              {importando
                ? `Importando... (${progresso?.atual ?? 0}/${progresso?.total ?? 0})`
                : `Importar ${validas.length} pingente(s) válido(s)`}
            </Button>
          </Reveal>
        )}

        {resultado && (
          <Reveal className="mt-14 max-w-2xl bg-cream-light border border-neutral-light rounded-xl px-6 py-5">
            <p className="text-navy">
              {resultado.criados} pingente(s) criado(s), {resultado.atualizados} atualizado(s).
            </p>
            {resultado.ocorrencias.length > 0 && (
              <div className="mt-4">
                <p className="label-caps text-magenta mb-2">Ocorrências</p>
                <ul className="space-y-1 text-sm text-navy/70">
                  {resultado.ocorrencias.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
