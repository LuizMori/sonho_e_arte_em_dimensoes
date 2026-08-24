import { Link } from "react-router-dom";
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

export function Blog() {
  usePageMeta(
    "Blog | Sonho e Arte em Dimensões",
    "Artigos sobre impressão 3D, modelagem, materiais, cuidados com peças, decoração e fabricação digital."
  );

  return (
    <section className="pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="container">
        <Reveal className="max-w-2xl mb-16">
          <p className="label-caps text-magenta mb-6">Conteúdo</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tightest text-navy leading-[1.05]">
            Blog
          </h1>
        </Reveal>

        <div className="divide-y divide-neutral-light">
          {posts.map((post, index) => (
            <Reveal key={post.slug} delay={Math.min(index * 60, 200)}>
              <Link
                to={`/blog/${post.slug}`}
                className="group grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-6 sm:gap-10 py-12"
              >
                <div className="aspect-[4/3] overflow-hidden order-1 sm:order-none">
                  <img
                    src={post.imagem.url}
                    alt={post.imagem.alt}
                    loading="lazy"
                    className="w-full h-full object-cover img-hover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-4 label-caps text-neutral mb-4">
                    <span>{post.categoria}</span>
                    <span aria-hidden="true">•</span>
                    <time dateTime={post.data}>{formatarData(post.data)}</time>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl text-navy group-hover:text-magenta transition-colors leading-tight">
                    {post.titulo}
                  </h2>
                  <p className="text-navy/70 mt-4 leading-relaxed max-w-xl">{post.resumo}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
