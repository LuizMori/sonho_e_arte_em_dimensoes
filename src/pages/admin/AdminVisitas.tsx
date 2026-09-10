import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { categorias } from "@/data/categorias";
import type { CategoriaSlug } from "@/types";

const PREFIXO_PRODUTO = "/portfolio/";

interface ProdutoResumo {
  nome: string;
  categoria: CategoriaSlug;
}

interface DiaAgregadoDb {
  dia: string;
  visualizacoes: number;
  visitantes: number;
}

interface PaginaAgregadaDb {
  path: string;
  visualizacoes: number;
}

const DIAS_JANELA = 30;
const DIAS_EXIBIDOS = 14;

// O agrupamento por dia acontece no banco (função estatisticas_visitas_por_dia), já no
// horário de Brasília — sem isso, visitas feitas à noite (depois de 21h em Brasília) já
// contariam como "amanhã".
const FUSO_HORARIO = "America/Sao_Paulo";

const formatarDataChave = (data: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_HORARIO, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    data
  );

const formatarDataLabel = (chave: string) =>
  new Date(`${chave}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

interface DiaAgregado {
  chave: string;
  visualizacoes: number;
  visitantes: number;
}

export function AdminVisitas() {
  usePageMeta("Visitas | Admin | Sonho e Arte em Dimensões", "Acompanhe as visitas diárias ao site.");

  const [diasAgregados, setDiasAgregados] = useState<DiaAgregadoDb[]>([]);
  const [paginasAgregadas, setPaginasAgregadas] = useState<PaginaAgregadaDb[]>([]);
  const [produtosPorSlug, setProdutosPorSlug] = useState<Map<string, ProdutoResumo>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaSlug | "todos">("todos");

  useEffect(() => {
    (async () => {
      const [{ data: porDiaDb }, { data: porPaginaDb }, { data: produtos }] = await Promise.all([
        supabase.rpc("estatisticas_visitas_por_dia", { p_dias: DIAS_JANELA }),
        supabase.rpc("estatisticas_visitas_por_pagina", { p_dias: DIAS_JANELA }),
        supabase.from("products").select("nome, slug, categoria"),
      ]);
      setDiasAgregados((porDiaDb as DiaAgregadoDb[]) ?? []);
      setPaginasAgregadas((porPaginaDb as PaginaAgregadaDb[]) ?? []);
      setProdutosPorSlug(
        new Map((produtos ?? []).map((p) => [p.slug, { nome: p.nome, categoria: p.categoria }]))
      );
      setCarregando(false);
    })();
  }, []);

  const porDia = useMemo(() => {
    const mapa = new Map(diasAgregados.map((d) => [d.dia, d]));

    const hojeChave = formatarDataChave(new Date());
    const ancora = new Date(`${hojeChave}T12:00:00Z`);

    const dias: DiaAgregado[] = [];
    for (let i = DIAS_EXIBIDOS - 1; i >= 0; i--) {
      const data = new Date(ancora);
      data.setUTCDate(data.getUTCDate() - i);
      const chave = formatarDataChave(data);
      const entrada = mapa.get(chave);
      dias.push({
        chave,
        visualizacoes: entrada?.visualizacoes ?? 0,
        visitantes: entrada?.visitantes ?? 0,
      });
    }
    return dias;
  }, [diasAgregados]);

  const resumo = useMemo(() => {
    const hojeChave = formatarDataChave(new Date());
    const hoje = diasAgregados.find((d) => d.dia === hojeChave);

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    const seteDiasChave = formatarDataChave(seteDiasAtras);

    const ultimos7 = diasAgregados
      .filter((d) => d.dia >= seteDiasChave)
      .reduce((soma, d) => soma + d.visualizacoes, 0);
    const ultimos30 = diasAgregados.reduce((soma, d) => soma + d.visualizacoes, 0);

    return {
      hoje: hoje?.visualizacoes ?? 0,
      visitantesHoje: hoje?.visitantes ?? 0,
      ultimos7,
      ultimos30,
    };
  }, [diasAgregados]);

  const produtosMaisVistos = useMemo(() => {
    return paginasAgregadas
      .filter((p) => p.path.startsWith(PREFIXO_PRODUTO))
      .map((p) => {
        const slug = p.path.slice(PREFIXO_PRODUTO.length);
        return { slug, ...p, produto: produtosPorSlug.get(slug) };
      })
      .filter((p) => filtroCategoria === "todos" || p.produto?.categoria === filtroCategoria)
      .map((p) => ({ nome: p.produto?.nome ?? p.slug, total: p.visualizacoes }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [paginasAgregadas, produtosPorSlug, filtroCategoria]);

  const paginasMaisVisitadas = useMemo(() => {
    return paginasAgregadas
      .filter((p) => !p.path.startsWith(PREFIXO_PRODUTO))
      .map((p) => [p.path, p.visualizacoes] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [paginasAgregadas]);

  const maxVisualizacoes = Math.max(1, ...porDia.map((d) => d.visualizacoes));

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-3xl">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Visitas
          </h1>
          <p className="text-sm text-navy/50 mt-4">
            Contador próprio de visualizações de página, sem cookies persistentes. Não conta acessos ao
            painel admin.
          </p>
        </Reveal>

        <AdminNav />

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : (
          <>
            <Reveal className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-16">
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Hoje</p>
                <p className="font-display text-3xl text-navy mt-2">{resumo.hoje}</p>
                <p className="text-navy/50 text-xs mt-1">{resumo.visitantesHoje} visitantes</p>
              </div>
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Últimos 7 dias</p>
                <p className="font-display text-3xl text-navy mt-2">{resumo.ultimos7}</p>
              </div>
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Últimos 30 dias</p>
                <p className="font-display text-3xl text-navy mt-2">{resumo.ultimos30}</p>
              </div>
            </Reveal>

            <Reveal className="mb-16">
              <p className="label-caps text-navy/70 mb-6">Últimos {DIAS_EXIBIDOS} dias</p>
              <div className="space-y-2">
                {porDia.map((dia) => (
                  <div key={dia.chave} className="flex items-center gap-4">
                    <span className="text-navy/50 text-xs w-10 shrink-0">{formatarDataLabel(dia.chave)}</span>
                    <div className="flex-1 bg-neutral-light/40 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-orange h-full rounded-full transition-all"
                        style={{ width: `${(dia.visualizacoes / maxVisualizacoes) * 100}%` }}
                      />
                    </div>
                    <span className="text-navy text-sm w-24 shrink-0 text-right">
                      {dia.visualizacoes} views · {dia.visitantes}v
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="mb-16">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="label-caps text-navy/70">Produtos mais buscados (30 dias)</p>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value as CategoriaSlug | "todos")}
                  className="label-caps bg-transparent border-b border-neutral-light py-1 text-navy text-xs focus:outline-none focus:border-magenta"
                >
                  <option value="todos">Todos</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.slug} value={categoria.slug}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>
              {produtosMaisVistos.length === 0 ? (
                <p className="text-navy/50 text-sm">Nenhuma visita a produtos registrada ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {produtosMaisVistos.map((produto) => (
                    <li
                      key={produto.nome}
                      className="flex items-center justify-between border-b border-neutral-light/60 pb-2"
                    >
                      <span className="text-navy text-sm">{produto.nome}</span>
                      <span className="text-navy/70 text-sm shrink-0">{produto.total} visualizações</span>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>

            <Reveal>
              <p className="label-caps text-navy/70 mb-4">Outras páginas mais visitadas (30 dias)</p>
              {paginasMaisVisitadas.length === 0 ? (
                <p className="text-navy/50 text-sm">Nenhuma visita registrada ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {paginasMaisVisitadas.map(([path, total]) => (
                    <li key={path} className="flex items-center justify-between border-b border-neutral-light/60 pb-2">
                      <span className="text-navy/80 text-sm">{path}</span>
                      <span className="text-navy text-sm shrink-0">{total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
