import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

interface ContatoPayload {
  nome: string;
  email: string;
  whatsapp: string;
  assunto: string;
  mensagem: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
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
