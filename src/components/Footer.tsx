import { Link } from "react-router-dom";
import { contatoInfo } from "@/data/institucional";
import { WhatsAppIcon, InstagramIcon, ShopeeIcon } from "@/components/icons/SocialIcons";

const iconesRedes: Record<string, typeof WhatsAppIcon> = {
  WhatsApp: WhatsAppIcon,
  Instagram: InstagramIcon,
  Shopee: ShopeeIcon,
};

const colunas = [
  {
    titulo: "Navegação",
    links: [
      { to: "/sobre", label: "Sobre" },
      { to: "/portfolio", label: "Portfólio" },
      { to: "/servicos", label: "Serviços" },
      { to: "/como-funciona", label: "Como funciona" },
    ],
  },
  {
    titulo: "Estúdio",
    links: [
      { to: "/orcamento", label: "Orçamento" },
      { to: "/contato", label: "Contato" },
      { to: "/privacidade", label: "Privacidade" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy-deep text-cream-light">
      <div className="container py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-12">
        <div>
          <Link to="/" className="font-display text-2xl tracking-tightest">
            Sonho e Arte <span className="text-orange font-normal">em Dimensões</span>
          </Link>
          <p className="mt-4 text-sm text-cream-light/60 max-w-xs leading-relaxed">
            Você imagina. A gente ajuda a dar forma.
          </p>
        </div>

        {colunas.map((coluna) => (
          <div key={coluna.titulo}>
            <p className="label-caps text-cream-light/40 mb-5">{coluna.titulo}</p>
            <ul className="space-y-3">
              {coluna.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-cream-light/80 hover:text-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="label-caps text-cream-light/40 mb-5">Contato</p>
          <ul className="space-y-3 text-sm text-cream-light/80">
            <li>{contatoInfo.email}</li>
            <li>{contatoInfo.whatsapp}</li>
          </ul>
          <ul className="mt-6 space-y-3">
            {contatoInfo.redesSociais.map((rede) => {
              const Icone = iconesRedes[rede.nome];
              return (
                <li key={rede.nome}>
                  <a
                    href={rede.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-cream-light/80 hover:text-orange transition-colors"
                  >
                    {Icone && <Icone className="w-5 h-5 shrink-0" />}
                    {rede.nome}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-light/10">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-cream-light/40">
          <p>Sonho e Arte em Dimensões. Todos os direitos reservados.</p>
          <p>Impressão 3D e fabricação digital</p>
        </div>
      </div>
    </footer>
  );
}
