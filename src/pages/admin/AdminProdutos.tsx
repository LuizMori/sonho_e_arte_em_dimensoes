import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { baixarCsv } from "@/lib/csv";
import { categoriasProduto } from "@/data/categorias";
import { COLUNAS_PRODUTO_CSV } from "@/data/produtoCsvColunas";
import type { Produto } from "@/types";

const ITENS_POR_PAGINA = 20;

export function AdminProdutos() {
  usePageMeta(
    "Produtos | Admin | Sonho e Arte em Dimensões",
    "Gerencie o catálogo de produtos da loja."
  );

  const { showToast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProdutos(data ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

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
    const linhas = produtosFiltrados.map((p) => [
      p.nome,
      p.descricao,
      String(p.preco),
      p.categoria,
      String(p.peso_g),
      String(p.altura_cm),
      String(p.largura_cm),
      String(p.comprimento_cm),
      String(p.stock),
      p.ativo ? "sim" : "nao",
      p.destaque ? "sim" : "nao",
      "",
      p.slug,
      p.tamanho_exibicao ?? "",
      "",
      "",
    ]);
    baixarCsv("produtos.csv", [...COLUNAS_PRODUTO_CSV], linhas);
  };

  const excluir = async (id: string) => {
    if (!window.confirm("Excluir este produto? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      showToast({ title: "Não foi possível excluir", description: error.message, variant: "error" });
      return;
    }
    carregar();
  };

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="flex flex-wrap items-center justify-between gap-6 mb-12">
          <div>
            <p className="label-caps text-magenta mb-6">Painel admin</p>
            <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
              Produtos
            </h1>
          </div>
          <div className="flex flex-wrap gap-4">
            {produtos.length > 0 && (
              <Button type="button" variant="outline" onClick={exportarCsv}>
                Exportar CSV
              </Button>
            )}
            <Link to="/admin/produtos/importar">
              <Button variant="outline">Importar CSV</Button>
            </Link>
            <Link to="/admin/produtos/novo">
              <Button>Novo produto</Button>
            </Link>
          </div>
        </Reveal>

        <AdminNav />

        {!carregando && produtos.length > 0 && (
          <Reveal className="flex flex-wrap items-center gap-4 mb-8">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome ou descrição..."
              className="rounded-lg border border-neutral-light px-3 py-2 text-sm text-navy bg-cream-light w-full sm:w-72"
            />
            <div className="flex items-center gap-3">
              <label htmlFor="categoria-filtro" className="label-caps text-navy/50">
                Categoria
              </label>
              <select
                id="categoria-filtro"
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

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : produtos.length === 0 ? (
          <p className="text-navy/60">Nenhum produto cadastrado ainda.</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="text-navy/60">Nenhum produto encontrado.</p>
        ) : (
          <div className="space-y-4">
            {produtosPagina.map((produto) => (
              <div
                key={produto.id}
                className="flex flex-wrap items-center justify-between gap-6 border-b border-neutral-light py-5"
              >
                <div>
                  <p className="text-navy font-medium">{produto.nome}</p>
                  <p className="text-navy/60 text-sm mt-1">
                    {produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · Estoque:{" "}
                    {produto.stock} · {produto.ativo ? "Ativo" : "Inativo"}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    to={`/admin/produtos/${produto.id}`}
                    className="label-caps text-navy/70 hover:text-navy transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => excluir(produto.id)}
                    className="label-caps text-navy/70 hover:text-magenta transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!carregando && produtosFiltrados.length > ITENS_POR_PAGINA && (
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            mostrarTodos={mostrarTodos}
            onPaginaChange={setPagina}
            onToggleMostrarTodos={() => setMostrarTodos((v) => !v)}
          />
        )}
      </div>
    </section>
  );
}
