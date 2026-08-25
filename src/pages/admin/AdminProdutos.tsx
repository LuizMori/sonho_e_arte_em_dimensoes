import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import type { Produto } from "@/types";

export function AdminProdutos() {
  usePageMeta(
    "Produtos | Admin | Sonho e Arte em Dimensões",
    "Gerencie o catálogo de produtos da loja."
  );

  const { showToast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProdutos(data ?? []);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

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
          <Link to="/admin/produtos/novo">
            <Button>Novo produto</Button>
          </Link>
        </Reveal>

        {carregando ? (
          <p className="text-navy/60">Carregando...</p>
        ) : produtos.length === 0 ? (
          <p className="text-navy/60">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="space-y-4">
            {produtos.map((produto) => (
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
      </div>
    </section>
  );
}
