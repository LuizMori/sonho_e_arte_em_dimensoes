import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

interface ContatoPayload {
  nome: string;
  email: string;
  whatsapp: string;
  assunto: string;
  mensagem: string;
}

const LIMITE_TENTATIVAS = 5;
const JANELA_MS = 10 * 60 * 1000; // 10 minutos

function ipDoRequest(req: VercelRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const primeiro = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return primeiro?.split(",")[0]?.trim() || req.socket.remoteAddress || "desconhecido";
}

// Endpoint público e sem autenticação: sem isso, dá pra automatizar chamadas e usar a caixa
// de CONTACT_EMAIL pra spam. Cada linha em rate_limits é uma tentativa; se já houver
// LIMITE_TENTATIVAS na janela recente para o mesmo IP+endpoint, bloqueia. Falha aberta (não
// bloqueia) se o Supabase não estiver configurado, pra não derrubar o formulário por causa
// só do rate limit.
async function limiteExcedido(chave: string): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const desde = new Date(Date.now() - JANELA_MS).toISOString();

  const { count } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("chave", chave)
    .gte("created_at", desde);

  if ((count ?? 0) >= LIMITE_TENTATIVAS) return true;

  await supabase.from("rate_limits").insert({ chave });

  // Limpeza oportunista de linhas antigas (sem precisar de um cron dedicado só pra isso).
  if (Math.random() < 0.05) {
    await supabase.from("rate_limits").delete().lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  }

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  if (await limiteExcedido(`contato:${ipDoRequest(req)}`)) {
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.CONTACT_EMAIL;

  if (!apiKey || !destinatario) {
    console.error("RESEND_API_KEY ou CONTACT_EMAIL não configurados nas variáveis de ambiente");
    res.status(500).json({ error: "Serviço de e-mail não configurado" });
    return;
  }

  const payload = req.body as ContatoPayload;
  const { nome, email, whatsapp, assunto, mensagem } = payload ?? {};

  if (!nome || !email || !whatsapp || !assunto || !mensagem) {
    res.status(400).json({ error: "Campos obrigatórios ausentes" });
    return;
  }

  const resend = new Resend(apiKey);

  const linhas = [
    `Nome completo: ${nome}`,
    `E-mail: ${email}`,
    `WhatsApp: ${whatsapp}`,
    `Assunto: ${assunto}`,
    "",
    mensagem,
  ];

  try {
    const { error } = await resend.emails.send({
      from: "Sonho e Arte em Dimensões <contato@sonhoearte3d.com.br>",
      to: destinatario,
      replyTo: email,
      subject: `Nova mensagem de contato de ${nome}`,
      text: linhas.join("\n"),
    });

    if (error) {
      console.error("Erro retornado pelo Resend:", error);
      res.status(502).json({ error: "Não foi possível enviar o e-mail" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail de contato:", error);
    res.status(500).json({ error: "Não foi possível enviar o e-mail" });
  }
}
