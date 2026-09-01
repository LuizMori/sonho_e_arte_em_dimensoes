import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthProvider";
import { useCart } from "@/lib/CartProvider";
import { contatoInfo } from "@/data/institucional";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/portfolio", label: "Portfólio" },
  { to: "/servicos", label: "Serviços" },
  { to: "/como-funciona", label: "Como funciona" },
];

const whatsappUrl =
  contatoInfo.redesSociais.find((rede) => rede.nome === "WhatsApp")?.url ?? "https://wa.me/5519995403588";

function ContatoMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [open]);

  const fechar = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "label-caps flex items-center gap-1 transition-colors",
          open ? "text-magenta" : "text-navy/70 hover:text-navy"
        )}
      >
        Contato
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-3 w-48 rounded-xl bg-cream-light border border-neutral-light shadow-lg py-2">
          <Link
            to="/contato"
            onClick={fechar}
            className="block px-4 py-2 text-sm text-navy hover:text-magenta hover:bg-neutral-light/40 transition-colors"
          >
            Dúvidas
          </Link>
          <Link
            to="/orcamento"
            onClick={fechar}
            className="block px-4 py-2 text-sm text-navy hover:text-magenta hover:bg-neutral-light/40 transition-colors"
          >
            Solicitar orçamento
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={fechar}
            className="block px-4 py-2 text-sm text-navy hover:text-magenta hover:bg-neutral-light/40 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 bg-cream-light",
        scrolled || open ? "shadow-[0_1px_0_0_rgba(42,37,76,0.08)]" : ""
      )}
    >
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex flex-col leading-tight font-display text-xl tracking-tightest text-orange" onClick={() => setOpen(false)}>
          <span>Sonho e Arte</span>
          <span className="font-normal">em Dimensões</span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <span className="text-navy/20 text-lg select-none" aria-hidden="true">
            |
          </span>

          <nav className="flex items-center gap-9">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "label-caps transition-colors",
                    isActive ? "text-magenta" : "text-navy/70 hover:text-navy"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <ContatoMenu />
          </nav>

          <span className="text-navy/20 text-lg select-none" aria-hidden="true">
            |
          </span>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {profile?.role === "admin" && (
                  <Link to="/admin/produtos" className="label-caps text-navy/70 hover:text-navy transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/conta" className="label-caps text-navy/70 hover:text-navy transition-colors">
                  Minha conta
                </Link>
                <button
                  onClick={handleSignOut}
                  className="label-caps text-navy/70 hover:text-magenta transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/login" className="label-caps text-navy/70 hover:text-navy transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Link to="/carrinho" aria-label="Carrinho" className="relative text-navy hover:text-magenta transition-colors" onClick={() => setOpen(false)}>
            <ShoppingBag size={22} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-magenta text-cream-light text-[10px] leading-none">
                {count}
              </span>
            )}
          </Link>

          <button
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="lg:hidden text-navy"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-cream-light border-t border-neutral-light">
          <nav className="container flex flex-col py-6 gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "py-3 border-b border-neutral-light/60 label-caps",
                    isActive ? "text-magenta" : "text-navy"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/contato"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn("py-3 border-b border-neutral-light/60 label-caps", isActive ? "text-magenta" : "text-navy")
              }
            >
              Dúvidas
            </NavLink>
            <NavLink
              to="/orcamento"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn("py-3 border-b border-neutral-light/60 label-caps", isActive ? "text-magenta" : "text-navy")
              }
            >
              Solicitar orçamento
            </NavLink>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="py-3 border-b border-neutral-light/60 label-caps text-navy"
            >
              WhatsApp
            </a>
            {user ? (
              <div className="flex items-center justify-between py-3 border-b border-neutral-light/60">
                <div className="flex items-center gap-4">
                  {profile?.role === "admin" && (
                    <Link to="/admin/produtos" onClick={() => setOpen(false)} className="label-caps text-navy">
                      Admin
                    </Link>
                  )}
                  <Link to="/conta" onClick={() => setOpen(false)} className="label-caps text-navy">
                    Minha conta
                  </Link>
                </div>
                <button onClick={handleSignOut} className="label-caps text-navy/70">
                  Sair
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn("py-3 border-b border-neutral-light/60 label-caps", isActive ? "text-magenta" : "text-navy")
                }
              >
                Entrar
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
