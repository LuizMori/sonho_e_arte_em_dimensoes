import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { baixarCsv } from "@/lib/csv";
import { categorias, categoriasProduto } from "@/data/categorias";
import type { Produto } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ITENS_POR_PAGINA = 20;
const COLUNAS_BALANCO = ["produto", "categoria", "estoque", "preco", "valor_total", "status"];

export function AdminBalanco() {
  usePageMeta("Balanço | Admin | Sonho e Arte em Dimensões", "Balanço do estoque de produtos da loja.");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("*").order("nome");
      setProdutos((data as Produto[]) ?? []);
      setCarregando(false);
    })();
  }, []);

  const resumo = useMemo(() => {
    const ativos = produtos.filter((p) => p.ativo).length;
    const semEstoque = produtos.filter((p) => p.stock === 0).length;
    const valorTotal = produtos.reduce((soma, p) => soma + p.stock * p.preco, 0);
    return { total: produtos.length, ativos, semEstoque, valorTotal };
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const passaCategoria = categoriaFiltro === "todas" || p.categoria === categoriaFiltro;
      const passaBusca =
        !termo || p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo);
      return passaCategoria && passaBusca;
    });
  }, [produtos, categoriaFiltro, busca]);

  useEffect(() => {
    setPagina(1);
  }, [categoriaFiltro, busca]);

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA));
  const produtosPagina = mostrarTodos
    ? produtosFiltrados
    : produtosFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  const exportarCsv = () => {
    const linhas = produtosFiltrados.map((p) => {
      const categoria = categorias.find((c) => c.slug === p.categoria);
      return [
        p.nome,
        categoria?.nome ?? p.categoria,
        String(p.stock),
        String(p.preco),
        String(p.stock * p.preco),
        p.ativo ? "Ativo" : "Inativo",
      ];
    });
    baixarCsv("balanco-produtos.csv", COLUNAS_BALANCO, linhas);
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <p className="label-caps text-magenta mb-6">Painel admin</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
              Balanço de produtos
            </h1>
          </div>
          {!carregando && produtos.length > 0 && (
            <Button type="button" variant="outline" onClick={exportarCsv}>
              Exportar CSV
            </Button>
          )}
        </Reveal>

        <AdminNav />

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : (
          <>
            <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-16">
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Produtos cadastrados</p>
                <p className="font-display text-3xl text-navy mt-2">{resumo.total}</p>
              </div>
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Ativos</p>
                <p className="font-display text-3xl text-navy mt-2">{resumo.ativos}</p>
              </div>
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Sem estoque</p>
                <p className="font-display text-3xl text-magenta mt-2">{resumo.semEstoque}</p>
              </div>
              <div className="border border-neutral-light rounded-xl px-5 py-4">
                <p className="label-caps text-navy/50">Valor total em estoque</p>
                <p className="font-display text-3xl text-navy mt-2">{formatarMoeda(resumo.valorTotal)}</p>
              </div>
            </Reveal>

            {produtos.length > 0 && (
              <Reveal className="flex flex-wrap items-center gap-4 mb-8">
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por nome ou descrição..."
                  className="rounded-lg border border-neutral-light px-3 py-2 text-sm text-navy bg-cream-light w-full sm:w-72"
                />
                <div className="flex items-center gap-3">
                  <label htmlFor="categoria-filtro-balanco" className="label-caps text-navy/50">
                    Categoria
                  </label>
                  <select
                    id="categoria-filtro-balanco"
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="rounded-lg border border-neutral-light px-3 py-2 text-sm text-navy bg-cream-light"
                  >
                    <option value="todas">Todas</option>
                    {categoriasProduto.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </Reveal>
            )}

            {produtos.length === 0 ? (
              <p className="text-navy/60">Nenhum produto cadastrado ainda.</p>
            ) : produtosFiltrados.length === 0 ? (
              <p className="text-navy/60">Nenhum produto encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left label-caps text-navy/50 border-b border-neutral-light">
                      <th className="pb-4 pr-4">Produto</th>
                      <th className="pb-4 pr-4">Categoria</th>
                      <th className="pb-4 pr-4">Estoque</th>
                      <th className="pb-4 pr-4">Preço</th>
                      <th className="pb-4 pr-4">Valor total</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosPagina.map((produto) => {
                      const categoria = categorias.find((c) => c.slug === produto.categoria);
                      return (
                        <tr key={produto.id} className="border-b border-neutral-light/60">
                          <td className="py-4 pr-4 text-navy">{produto.nome}</td>
                          <td className="py-4 pr-4 text-navy/70">{categoria?.nome ?? produto.categoria}</td>
                          <td className={`py-4 pr-4 ${produto.stock === 0 ? "text-magenta" : "text-navy"}`}>
                            {produto.stock}
                          </td>
                          <td className="py-4 pr-4 text-navy whitespace-nowrap">{formatarMoeda(produto.preco)}</td>
                          <td className="py-4 pr-4 text-navy whitespace-nowrap">
                            {formatarMoeda(produto.stock * produto.preco)}
                          </td>
                          <td className="py-4 text-navy/70">{produto.ativo ? "Ativo" : "Inativo"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {produtosFiltrados.length > ITENS_POR_PAGINA && (
              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                mostrarTodos={mostrarTodos}
                onPaginaChange={setPagina}
                onToggleMostrarTodos={() => setMostrarTodos((v) => !v)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
