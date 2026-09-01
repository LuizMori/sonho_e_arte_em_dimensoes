import { useLocation } from "react-router-dom";
import { WhatsAppIcon } from "@/components/icons/SocialIcons";
import { contatoInfo } from "@/data/institucional";

const whatsappUrl =
  contatoInfo.redesSociais.find((rede) => rede.nome === "WhatsApp")?.url ?? "https://wa.me/5519995403588";

export function FloatingWhatsApp() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-3"
    >
      <span className="hidden sm:block max-w-0 overflow-hidden whitespace-nowrap rounded-xl bg-navy text-cream-light text-sm px-0 py-0 opacity-0 shadow-lg transition-all duration-300 group-hover:max-w-xs group-hover:px-4 group-hover:py-2 group-hover:opacity-100">
        Fale conosco no WhatsApp
      </span>
      <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
        <WhatsAppIcon className="w-7 h-7" />
      </span>
    </a>
  );
}
