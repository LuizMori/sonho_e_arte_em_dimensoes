import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/portfolio", label: "Portfólio" },
  { to: "/servicos", label: "Serviços" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tightest text-navy" onClick={() => setOpen(false)}>
          <span className="hidden sm:inline">Sonho e Arte</span>
          <span className="sm:hidden">S&A</span>
          <span className="text-orange font-normal">em Dimensões</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
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
        </nav>

        <div className="hidden lg:block">
          <Link
            to="/orcamento"
            className="label-caps inline-flex items-center rounded-full bg-navy text-cream-light px-6 py-3 hover:bg-magenta transition-colors"
          >
            Solicitar orçamento
          </Link>
        </div>

        <button
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="lg:hidden text-navy"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
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
            <Link
              to="/orcamento"
              onClick={() => setOpen(false)}
              className="mt-5 label-caps inline-flex items-center justify-center rounded-full bg-navy text-cream-light px-6 py-3.5"
            >
              Solicitar orçamento
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
