import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lança erro aqui: isso derrubaria o site inteiro (AuthProvider envolve todas as páginas,
  // não só as de conta). Sem essas variáveis, chamadas ao Supabase falham individualmente e cada
  // método do AuthProvider já trata o erro sem quebrar a navegação no resto do site.
  console.warn(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configurados — recursos de conta/login ficarão indisponíveis (veja .env.example)"
  );
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");
