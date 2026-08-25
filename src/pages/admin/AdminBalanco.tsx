import { useEffect, useMemo, useState } from "react";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { AdminNav } from "@/components/admin/AdminNav";
import { supabase } from "@/lib/supabaseClient";
import { categorias } from "@/data/categorias";
import type { Produto } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AdminBalanco() {
  usePageMeta("Balanço | Admin | Sonho e Arte em Dimensões", "Balanço do estoque de produtos da loja.");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="mb-12">
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            Balanço de produtos
          </h1>
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

            {produtos.length === 0 ? (
              <p className="text-navy/60">Nenhum produto cadastrado ainda.</p>
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
                    {produtos.map((produto) => {
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
          </>
        )}
      </div>
    </section>
  );
}
