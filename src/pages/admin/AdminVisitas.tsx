import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { categorias } from "@/data/categorias";
import type { CategoriaSlug, PageView } from "@/types";

const PREFIXO_PRODUTO = "/portfolio/";

interface ProdutoResumo {
  nome: string;
  categoria: CategoriaSlug;
}

const DIAS_JANELA = 30;
const DIAS_EXIBIDOS = 14;

// Todo o agrupamento por dia usa o horário de Brasília, não UTC — sem isso, visitas
// feitas à noite (depois de 21h em Brasília) já contavam como "amanhã".
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

  const [visitas, setVisitas] = useState<PageView[]>([]);
  const [produtosPorSlug, setProdutosPorSlug] = useState<Map<string, ProdutoResumo>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaSlug | "todos">("todos");

  useEffect(() => {
    (async () => {
      const desde = new Date();
      desde.setDate(desde.getDate() - DIAS_JANELA);
      const [{ data: views }, { data: produtos }] = await Promise.all([
        supabase
          .from("page_views")
          .select("*")
          .gte("created_at", desde.toISOString())
          .order("created_at", { ascending: true }),
        supabase.from("products").select("nome, slug, categoria"),
      ]);
      setVisitas((views as PageView[]) ?? []);
      setProdutosPorSlug(
        new Map((produtos ?? []).map((p) => [p.slug, { nome: p.nome, categoria: p.categoria }]))
      );
      setCarregando(false);
    })();
  }, []);

  const porDia = useMemo(() => {
    const mapa = new Map<string, { visualizacoes: number; sessoes: Set<string> }>();
    for (const visita of visitas) {
      const chave = formatarDataChave(new Date(visita.created_at));
      const entrada = mapa.get(chave) ?? { visualizacoes: 0, sessoes: new Set<string>() };
      entrada.visualizacoes += 1;
      entrada.sessoes.add(visita.session_id);
      mapa.set(chave, entrada);
    }

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
        visitantes: entrada?.sessoes.size ?? 0,
      });
    }
    return dias;
  }, [visitas]);

  const resumo = useMemo(() => {
    const hojeChave = formatarDataChave(new Date());
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const hoje = visitas.filter((v) => formatarDataChave(new Date(v.created_at)) === hojeChave);
    const ultimos7 = visitas.filter((v) => new Date(v.created_at) >= seteDiasAtras);

    return {
      hoje: hoje.length,
      visitantesHoje: new Set(hoje.map((v) => v.session_id)).size,
      ultimos7: ultimos7.length,
      ultimos30: visitas.length,
    };
  }, [visitas]);

  const produtosMaisVistos = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const visita of visitas) {
      if (!visita.path.startsWith(PREFIXO_PRODUTO)) continue;
      const slug = visita.path.slice(PREFIXO_PRODUTO.length);
      if (filtroCategoria !== "todos" && produtosPorSlug.get(slug)?.categoria !== filtroCategoria) continue;
      mapa.set(slug, (mapa.get(slug) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .map(([slug, total]) => ({ nome: produtosPorSlug.get(slug)?.nome ?? slug, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [visitas, produtosPorSlug, filtroCategoria]);

  const paginasMaisVisitadas = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const visita of visitas) {
      if (visita.path.startsWith(PREFIXO_PRODUTO)) continue;
      mapa.set(visita.path, (mapa.get(visita.path) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [visitas]);

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
