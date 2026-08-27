import { useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadProductImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { parseCsv, linhasParaObjetos, paraLinhaCsv } from "@/lib/csv";
import { categoriasProduto } from "@/data/categorias";
import { COLUNAS_PRODUTO_CSV } from "@/data/produtoCsvColunas";
import type { CategoriaSlug, Color } from "@/types";

const COLUNAS = COLUNAS_PRODUTO_CSV;

interface LinhaImportacao {
  numero: number;
  bruto: Record<string, string>;
  erros: string[];
  dados?: {
    nome: string;
    descricao: string;
    preco: number;
    categoria: CategoriaSlug;
    peso_kg: number;
    altura_cm: number;
    largura_cm: number;
    comprimento_cm: number;
    stock: number;
    ativo: boolean;
    destaque: boolean;
    fotos: string[];
    slug: string;
    tamanho_exibicao: string | null;
    cores: string[];
    variacoes: string[];
  };
}

const VALORES_VERDADEIROS = ["sim", "s", "true", "1", "yes"];
const VALORES_FALSOS = ["nao", "não", "n", "false", "0", "no", ""];

function paraBooleano(valor: string, padrao: boolean): boolean {
  const normalizado = valor.trim().toLowerCase();
  if (normalizado === "") return padrao;
  if (VALORES_VERDADEIROS.includes(normalizado)) return true;
  if (VALORES_FALSOS.includes(normalizado)) return false;
  return padrao;
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

  const descricao = bruto.descricao?.trim() ?? "";
  if (descricao.length < 10) erros.push("descricao precisa ter pelo menos 10 caracteres");

  const preco = paraNumero(bruto.preco ?? "");
  if (preco === null || preco <= 0) erros.push("preco inválido");

  const categoriaValor = bruto.categoria?.trim().toLowerCase() ?? "";
  const categoriaValida = categoriasProduto.find((c) => c.slug === categoriaValor);
  if (!categoriaValida) {
    erros.push(`categoria inválida (use: ${categoriasProduto.map((c) => c.slug).join(", ")})`);
  }

  const pesoKg = paraNumero(bruto.peso_kg ?? "");
  if (pesoKg === null || pesoKg <= 0) erros.push("peso_kg inválido");

  const alturaCm = paraNumero(bruto.altura_cm ?? "");
  if (alturaCm === null || alturaCm <= 0) erros.push("altura_cm inválido");

  const larguraCm = paraNumero(bruto.largura_cm ?? "");
  if (larguraCm === null || larguraCm <= 0) erros.push("largura_cm inválido");

  const comprimentoCm = paraNumero(bruto.comprimento_cm ?? "");
  if (comprimentoCm === null || comprimentoCm <= 0) erros.push("comprimento_cm inválido");

  const stockValor = bruto.stock?.trim() ?? "";
  const stock = stockValor === "" ? 0 : paraNumero(stockValor);
  if (stock === null || stock < 0 || !Number.isInteger(stock)) erros.push("stock inválido");

  const fotos = (bruto.fotos ?? "")
    .split(";")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const cores = (bruto.cores ?? "")
    .split(";")
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0);

  const variacoes = (bruto.variacoes ?? "")
    .split(";")
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0);

  if (erros.length > 0) {
    return { numero, bruto, erros };
  }

  const slugInformado = bruto.slug?.trim();
  const slug = slugInformado ? slugify(slugInformado) : `${slugify(nome)}-${Date.now().toString(36)}-${numero}`;

  return {
    numero,
    bruto,
    erros: [],
    dados: {
      nome,
      descricao,
      preco: preco as number,
      categoria: categoriaValida!.slug as CategoriaSlug,
      peso_kg: pesoKg as number,
      altura_cm: alturaCm as number,
      largura_cm: larguraCm as number,
      comprimento_cm: comprimentoCm as number,
      stock: stock as number,
      ativo: paraBooleano(bruto.ativo ?? "", true),
      destaque: paraBooleano(bruto.destaque ?? "", false),
      fotos,
      slug,
      tamanho_exibicao: bruto.tamanho_exibicao?.trim() || null,
      cores,
      variacoes,
    },
  };
}

export function AdminProdutoImportar() {
  usePageMeta("Importar produtos | Admin | Sonho e Arte em Dimensões", "Importe produtos em lote via arquivo CSV.");

  const { showToast } = useToast();
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<{
    criados: number;
    atualizados: number;
    fotosComFalha: string[];
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
      showToast({ title: "Arquivo vazio", description: "Nenhuma linha de produto encontrada.", variant: "error" });
      setLinhas([]);
      return;
    }

    setLinhas(objetos.map((obj, index) => validarLinha(obj, index + 2)));
    event.target.value = "";
  };

  const baixarModelo = () => {
    const exemplo = [
      "Ursinho impresso em 3D",
      "Ursinho decorativo impresso em PLA, acabamento liso e pintura à mão.",
      "49.90",
      "decoracao",
      "0.150",
      "12",
      "8",
      "8",
      "10",
      "sim",
      "nao",
      "https://exemplo.com/foto1.jpg;https://exemplo.com/foto2.jpg",
      "",
      "Tamanho único",
      "Preto;Branco",
      "",
    ];
    const conteudo = [paraLinhaCsv([...COLUNAS]), paraLinhaCsv(exemplo)].join("\n");
    const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-produtos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const notificarReposicao = async (produtoId: string, token: string) => {
    try {
      await fetch("/api/stock/notify-restock", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: produtoId }),
      });
    } catch {
      // silencioso: falha no aviso não deve travar a importação
    }
  };

  const importar = async () => {
    if (validas.length === 0) return;
    setImportando(true);
    setProgresso({ atual: 0, total: validas.length });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data: paleta } = await supabase.from("colors").select("*");
    const paletaCores = (paleta as Color[]) ?? [];

    let criados = 0;
    let atualizados = 0;
    const fotosComFalha: string[] = [];

    for (let i = 0; i < validas.length; i++) {
      const { dados } = validas[i];
      if (!dados) continue;
      setProgresso({ atual: i + 1, total: validas.length });

      const payload = {
        nome: dados.nome,
        descricao: dados.descricao,
        preco: dados.preco,
        categoria: dados.categoria,
        peso_kg: dados.peso_kg,
        altura_cm: dados.altura_cm,
        largura_cm: dados.largura_cm,
        comprimento_cm: dados.comprimento_cm,
        stock: dados.stock,
        ativo: dados.ativo,
        destaque: dados.destaque,
        tamanho_exibicao: dados.tamanho_exibicao,
      };

      const { data: existente } = await supabase
        .from("products")
        .select("id, stock")
        .eq("slug", dados.slug)
        .maybeSingle();

      let produtoId: string | null = null;

      if (existente) {
        const { error } = await supabase.from("products").update(payload).eq("id", existente.id);
        if (error) {
          fotosComFalha.push(`${dados.nome}: não foi possível atualizar (${error.message})`);
          continue;
        }
        produtoId = existente.id;
        atualizados++;
        if (existente.stock === 0 && dados.stock > 0 && session) {
          notificarReposicao(existente.id, session.access_token);
        }
      } else {
        const { data: novo, error } = await supabase
          .from("products")
          .insert({ ...payload, slug: dados.slug })
          .select()
          .single();
        if (error || !novo) {
          fotosComFalha.push(`${dados.nome}: não foi possível criar (${error?.message ?? "erro desconhecido"})`);
          continue;
        }
        produtoId = novo.id;
        criados++;
      }

      if (!produtoId) continue;

      if (dados.cores.length > 0) {
        const idsEncontrados: string[] = [];
        for (const nomeCor of dados.cores) {
          const cor = paletaCores.find((c) => c.nome.toLowerCase() === nomeCor.toLowerCase());
          if (cor) {
            idsEncontrados.push(cor.id);
          } else {
            fotosComFalha.push(`${dados.nome}: cor "${nomeCor}" não existe na paleta, ignorada`);
          }
        }
        await supabase.from("product_colors").delete().eq("product_id", produtoId);
        if (idsEncontrados.length > 0) {
          await supabase
            .from("product_colors")
            .insert(idsEncontrados.map((colorId) => ({ product_id: produtoId, color_id: colorId })));
        }
      }

      if (dados.variacoes.length > 0) {
        await supabase.from("product_variations").delete().eq("product_id", produtoId);
        await supabase.from("product_variations").insert(
          dados.variacoes.map((nomeVariacao, ordem) => ({
            product_id: produtoId,
            nome: nomeVariacao,
            ordem,
          }))
        );
      }

      if (dados.fotos.length === 0) continue;

      const { data: imagensExistentes } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", produtoId);
      const ordemInicial = imagensExistentes?.length ?? 0;

      for (let f = 0; f < dados.fotos.length; f++) {
        const urlFoto = dados.fotos[f];
        try {
          const resposta = await fetch(urlFoto);
          if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
          const blob = await resposta.blob();
          const extensao = urlFoto.split(".").pop()?.split("?")[0] || "jpg";
          const arquivo = new File([blob], `foto.${extensao}`, { type: blob.type || "image/jpeg" });
          const urlPublica = await uploadProductImage(arquivo, produtoId);
          await supabase
            .from("product_images")
            .insert({ product_id: produtoId, url: urlPublica, alt: "", ordem: ordemInicial + f });
        } catch (err) {
          fotosComFalha.push(
            `${dados.nome}: falha ao importar foto (${urlFoto}) — ${err instanceof Error ? err.message : "erro desconhecido"}`
          );
        }
      }
    }

    setImportando(false);
    setProgresso(null);
    setResultado({ criados, atualizados, fotosComFalha });
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
              Importar produtos
            </h1>
          </div>
          <Link to="/admin/produtos">
            <Button variant="outline">Voltar para produtos</Button>
          </Link>
        </Reveal>

        <AdminNav />

        <Reveal className="max-w-2xl">
          <p className="text-navy/70 leading-relaxed">
            Envie um arquivo CSV para cadastrar ou atualizar vários produtos de uma vez. Se a planilha tiver
            a coluna <code className="text-navy">slug</code> preenchida e ela já existir, o produto é
            atualizado em vez de duplicado. A coluna <code className="text-navy">fotos</code> aceita uma ou
            mais URLs de imagem separadas por <code className="text-navy">;</code> — cada uma é baixada e
            enviada automaticamente para o catálogo. A coluna{" "}
            <code className="text-navy">tamanho_exibicao</code> é opcional e substitui a dimensão em cm na
            página do produto (ex: "Tamanho único"). A coluna <code className="text-navy">cores</code> é
            opcional e aceita nomes de cores já cadastrados em <code className="text-navy">/admin/cores</code>,
            separados por <code className="text-navy">;</code> (ex: "Preto;Branco") — nomes que não existem
            na paleta são ignorados. A coluna <code className="text-navy">variacoes</code> é opcional e
            aceita qualquer texto separado por <code className="text-navy">;</code> (ex:
            "Branca de Neve;Cinderela;Elsa") — use quando o produto tem opções que não são cor, como
            personagens ou estampas.
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
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Categoria</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Preço</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Fotos</th>
                    <th className="text-left px-4 py-3 label-caps text-navy/60">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.numero} className="border-t border-neutral-light">
                      <td className="px-4 py-3 text-navy/60">{linha.numero}</td>
                      <td className="px-4 py-3 text-navy">{linha.bruto.nome || "—"}</td>
                      <td className="px-4 py-3 text-navy/70">{linha.bruto.categoria || "—"}</td>
                      <td className="px-4 py-3 text-navy/70">{linha.bruto.preco || "—"}</td>
                      <td className="px-4 py-3 text-navy/70">
                        {(linha.bruto.fotos ?? "").split(";").filter((f) => f.trim()).length}
                      </td>
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
                : `Importar ${validas.length} produto(s) válido(s)`}
            </Button>
          </Reveal>
        )}

        {resultado && (
          <Reveal className="mt-14 max-w-2xl bg-cream-light border border-neutral-light rounded-xl px-6 py-5">
            <p className="text-navy">
              {resultado.criados} produto(s) criado(s), {resultado.atualizados} atualizado(s).
            </p>
            {resultado.fotosComFalha.length > 0 && (
              <div className="mt-4">
                <p className="label-caps text-magenta mb-2">Ocorrências</p>
                <ul className="space-y-1 text-sm text-navy/70">
                  {resultado.fotosComFalha.map((msg) => (
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
