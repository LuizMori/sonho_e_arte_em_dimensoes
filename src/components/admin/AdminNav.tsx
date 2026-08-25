import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/balanco", label: "Balanço" },
  { to: "/admin/depoimentos", label: "Depoimentos" },
  { to: "/admin/visitas", label: "Visitas" },
  { to: "/admin/usuarios", label: "Usuários" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-x-8 gap-y-3 border-b border-neutral-light pb-6 mb-12">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn("label-caps transition-colors", isActive ? "text-magenta" : "text-navy/60 hover:text-navy")
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
