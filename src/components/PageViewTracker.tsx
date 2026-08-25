import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

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

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    supabase.from("page_views").insert({ path: pathname, session_id: obterSessionId() });
  }, [pathname]);

  return null;
}
