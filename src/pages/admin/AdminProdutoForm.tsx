import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
import { uploadProductImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { produtoSchema, type ProdutoFormData } from "@/lib/schemas";
import { categorias } from "@/data/categorias";
import type { ProdutoImagemDb } from "@/types";

export function AdminProdutoForm() {
  const { id } = useParams<{ id: string }>();
  const editando = Boolean(id);

  usePageMeta(
    editando ? "Editar produto | Admin | Sonho e Arte em Dimensões" : "Novo produto | Admin | Sonho e Arte em Dimensões",
    "Cadastro de produtos da Sonho e Arte em Dimensões."
  );

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [carregando, setCarregando] = useState(editando);
  const [imagens, setImagens] = useState<ProdutoImagemDb[]>([]);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: { ativo: true, stock: 0, destaque: false, categoria: "decoracao" },
  });

  useEffect(() => {
    if (!id) return;

    (async () => {
      const [{ data: produto }, { data: imgs }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("product_images").select("*").eq("product_id", id).order("ordem"),
      ]);

      if (produto) {
        reset({
          nome: produto.nome,
          descricao: produto.descricao,
          preco: produto.preco,
          categoria: produto.categoria,
          destaque: produto.destaque,
          pesoKg: produto.peso_kg,
          alturaCm: produto.altura_cm,
          larguraCm: produto.largura_cm,
          comprimentoCm: produto.comprimento_cm,
          stock: produto.stock,
          ativo: produto.ativo,
        });
      }
      setImagens(imgs ?? []);
      setCarregando(false);
    })();
  }, [id, reset]);

  const onSubmit = async (data: ProdutoFormData) => {
    setStatus("loading");

    const payload = {
      nome: data.nome,
      descricao: data.descricao,
      preco: data.preco,
      categoria: data.categoria,
      destaque: data.destaque,
      peso_kg: data.pesoKg,
      altura_cm: data.alturaCm,
      largura_cm: data.larguraCm,
      comprimento_cm: data.comprimentoCm,
      stock: data.stock,
      ativo: data.ativo,
    };

    if (editando && id) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      setStatus("idle");

      if (error) {
        showToast({ title: "Não foi possível salvar", description: error.message, variant: "error" });
        return;
      }

      showToast({ title: "Produto atualizado", variant: "success" });
      return;
    }

    const slug = `${slugify(data.nome)}-${Date.now().toString(36)}`;
    const { data: novo, error } = await supabase
      .from("products")
      .insert({ ...payload, slug })
      .select()
      .single();

    setStatus("idle");

    if (error || !novo) {
      showToast({
        title: "Não foi possível criar o produto",
        description: error?.message,
        variant: "error",
      });
      return;
    }

    showToast({ title: "Produto criado", description: "Agora adicione as fotos.", variant: "success" });
    navigate(`/admin/produtos/${novo.id}`, { replace: true });
  };

  const handleUploadImagem = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo || !id) return;

    setEnviandoImagem(true);
    try {
      const url = await uploadProductImage(arquivo, id);
      const { data: nova, error } = await supabase
        .from("product_images")
        .insert({ product_id: id, url, alt: "", ordem: imagens.length })
        .select()
        .single();

      if (error || !nova) throw error ?? new Error("Falha ao salvar imagem");
      setImagens((prev) => [...prev, nova]);
    } catch {
      showToast({ title: "Não foi possível enviar a imagem", variant: "error" });
    } finally {
      setEnviandoImagem(false);
      event.target.value = "";
    }
  };

  const removerImagem = async (imagemId: string) => {
    const { error } = await supabase.from("product_images").delete().eq("id", imagemId);
    if (error) {
      showToast({ title: "Não foi possível remover a foto", variant: "error" });
      return;
    }
    setImagens((prev) => prev.filter((img) => img.id !== imagemId));
  };

  if (carregando) {
    return (
      <section className="pt-40 pb-24 md:pt-48 md:pb-32">
        <div className="container">
          <p className="text-navy/60">Carregando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container max-w-2xl">
        <Reveal>
          <p className="label-caps text-magenta mb-6">Painel admin</p>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tightest text-navy leading-[1.05]">
            {editando ? "Editar produto" : "Novo produto"}
          </h1>

          {!editando && (
            <p className="text-sm text-navy/50 mt-4">
              Depois de criar o produto, você poderá adicionar fotos aqui mesmo.
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-14" noValidate>
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register("nome")} />
              <FieldError message={errors.nome?.message} />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" rows={5} {...register("descricao")} />
              <FieldError message={errors.descricao?.message} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input id="preco" type="number" step="0.01" min="0" {...register("preco")} />
                <FieldError message={errors.preco?.message} />
              </div>
              <div>
                <Label htmlFor="stock">Estoque</Label>
                <Input id="stock" type="number" step="1" min="0" {...register("stock")} />
                <FieldError message={errors.stock?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select id="categoria" {...register("categoria")}>
                {categorias.map((categoria) => (
                  <option key={categoria.slug} value={categoria.slug}>
                    {categoria.nome}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.categoria?.message} />
            </div>

            <div>
              <p className="label-caps text-navy/70 mb-4">Peso e dimensões (obrigatórios)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="pesoKg">Peso (kg)</Label>
                  <Input id="pesoKg" type="number" step="0.001" min="0" {...register("pesoKg")} />
                  <FieldError message={errors.pesoKg?.message} />
                </div>
                <div>
                  <Label htmlFor="alturaCm">Altura (cm)</Label>
                  <Input id="alturaCm" type="number" step="0.1" min="0" {...register("alturaCm")} />
                  <FieldError message={errors.alturaCm?.message} />
                </div>
                <div>
                  <Label htmlFor="larguraCm">Largura (cm)</Label>
                  <Input id="larguraCm" type="number" step="0.1" min="0" {...register("larguraCm")} />
                  <FieldError message={errors.larguraCm?.message} />
                </div>
                <div>
                  <Label htmlFor="comprimentoCm">Comprimento (cm)</Label>
                  <Input id="comprimentoCm" type="number" step="0.1" min="0" {...register("comprimentoCm")} />
                  <FieldError message={errors.comprimentoCm?.message} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 text-navy">
                <input type="checkbox" className="h-4 w-4" {...register("ativo")} />
                <span className="label-caps">Produto ativo (visível no portfólio)</span>
              </label>
              <label className="flex items-center gap-3 text-navy">
                <input type="checkbox" className="h-4 w-4" {...register("destaque")} />
                <span className="label-caps">Destacar na página inicial</span>
              </label>
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
              {status === "loading" ? "Salvando..." : editando ? "Salvar alterações" : "Criar produto"}
            </Button>
          </form>

          {editando && (
            <div className="mt-16">
              <p className="label-caps text-navy/70 mb-4">Fotos</p>

              {imagens.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
                  {imagens.map((imagem) => (
                    <div key={imagem.id} className="relative group">
                      <img src={imagem.url} alt={imagem.alt} className="w-full aspect-square object-cover" />
                      <button
                        type="button"
                        onClick={() => removerImagem(imagem.id)}
                        aria-label="Remover foto"
                        className="absolute top-1 right-1 bg-navy text-cream-light text-xs rounded-full h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="label-caps inline-flex items-center rounded-full border border-navy text-navy px-6 py-3 cursor-pointer hover:border-magenta hover:text-magenta transition-colors">
                {enviandoImagem ? "Enviando..." : "Adicionar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadImagem}
                  disabled={enviandoImagem}
                />
              </label>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
