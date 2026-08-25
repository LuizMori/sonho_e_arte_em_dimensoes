import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthProvider";
import { useCart } from "@/lib/CartProvider";

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
        <Link to="/" className="flex items-center font-display text-xl tracking-tightest text-navy" onClick={() => setOpen(false)}>
          <span className="hidden sm:inline">Sonho e Arte&nbsp;</span>
          <span className="sm:hidden">S&A&nbsp;</span>
          <span className="text-orange font-normal">em Dimensões</span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
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
          </nav>

          <div className="flex items-center gap-6 pl-2 border-l border-neutral-light">
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
            <Link
              to="/orcamento"
              className="label-caps inline-flex items-center rounded-full bg-navy text-cream-light px-6 py-3 hover:bg-magenta transition-colors"
            >
              Solicitar orçamento
            </Link>
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
