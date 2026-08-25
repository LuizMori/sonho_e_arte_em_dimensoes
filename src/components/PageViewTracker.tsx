import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthProvider";

const CHAVE_SESSAO = "sonho-arte-session-id";

function obterSessionId(): string {
  let id = sessionStorage.getItem(CHAVE_SESSAO);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CHAVE_SESSAO, id);
  }
  return id;
}

export function PageViewTracker() {
  const { pathname } = useLocation();
  const { profile } = useAuth();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (profile?.role === "admin") return;
    void supabase.from("page_views").insert({ path: pathname, session_id: obterSessionId() }).then();
  }, [pathname, profile]);

  return null;
}
