import { Link, Navigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/lib/usePageMeta";
import { Reveal } from "@/components/Reveal";
import { posts } from "@/data/posts";

function formatarData(data: string): string {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const index = posts.findIndex((p) => p.slug === slug);
  const post = index >= 0 ? posts[index] : undefined;

  usePageMeta(
    post ? `${post.titulo} | Blog | Sonho e Arte em Dimensões` : "Post não encontrado",
    post?.resumo ?? "Post não encontrado no blog da Sonho e Arte em Dimensões."
  );

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const anterior = posts[(index - 1 + posts.length) % posts.length];
  const proximo = posts[(index + 1) % posts.length];

  return (
    <>
      <section className="pt-40 pb-12 md:pt-48">
        <div className="container max-w-2xl">
          <Reveal>
            <Link to="/blog" className="label-caps text-navy/60 hover:text-magenta transition-colors">
              Voltar ao blog
            </Link>
            <div className="flex items-center gap-4 label-caps text-neutral mt-8 mb-6">
              <span>{post.categoria}</span>
              <span aria-hidden="true">•</span>
              <time dateTime={post.data}>{formatarData(post.data)}</time>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tightest text-navy leading-[1.08]">
              {post.titulo}
            </h1>
          </Reveal>
        </div>
      </section>

      <Reveal delay={100} className="container">
        <img
          src={post.imagem.url}
          alt={post.imagem.alt}
          className="w-full h-auto max-h-[70vh] object-cover"
        />
      </Reveal>

      <section className="py-16 md:py-20">
        <div className="container max-w-2xl">
          <Reveal className="prose-content space-y-6">
            {post.conteudo.map((paragrafo) => (
              <p key={paragrafo} className="text-navy/80 text-lg leading-relaxed">
                {paragrafo}
              </p>
            ))}
          </Reveal>
          <Reveal delay={80} className="mt-12 pt-8 border-t border-neutral-light">
            <p className="label-caps text-neutral">Por {post.autor}</p>
          </Reveal>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-neutral-light">
        <div className="container grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Link to={`/blog/${anterior.slug}`} className="group">
            <p className="label-caps text-neutral mb-2">Anterior</p>
            <p className="font-display text-2xl text-navy group-hover:text-magenta transition-colors">
              {anterior.titulo}
            </p>
          </Link>
          <Link to={`/blog/${proximo.slug}`} className="group sm:text-right">
            <p className="label-caps text-neutral mb-2">Próximo</p>
            <p className="font-display text-2xl text-navy group-hover:text-magenta transition-colors">
              {proximo.titulo}
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
