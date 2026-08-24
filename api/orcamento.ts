import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

interface ArquivoAnexo {
  nome: string;
  tipo: string;
  conteudo: string;
}

interface OrcamentoPayload {
  nome: string;
  email: string;
  whatsapp: string;
  tipoProjeto: string;
  quantidade: string;
  possuiArquivo: "sim" | "nao";
  observacoes?: string;
  arquivo?: ArquivoAnexo;
}

const TAMANHO_MAXIMO_ANEXO = 3 * 1024 * 1024; // 3MB, dentro do limite de payload das funções serverless da Vercel

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

  const payload = req.body as OrcamentoPayload;
  const { nome, email, whatsapp, tipoProjeto, quantidade, possuiArquivo, observacoes, arquivo } = payload ?? {};

  if (!nome || !email || !whatsapp || !tipoProjeto || !quantidade) {
    res.status(400).json({ error: "Campos obrigatórios ausentes" });
    return;
  }

  if (arquivo && Buffer.byteLength(arquivo.conteudo, "base64") > TAMANHO_MAXIMO_ANEXO) {
    res.status(413).json({ error: "Arquivo muito grande" });
    return;
  }

  const resend = new Resend(apiKey);

  const linhas = [
    `Nome completo: ${nome}`,
    `E-mail: ${email}`,
    `Celular/WhatsApp: ${whatsapp}`,
    `Tipo de projeto: ${tipoProjeto}`,
    `Quantidade: ${quantidade}`,
    `Possui arquivo 3D: ${possuiArquivo === "sim" ? "Sim" : "Não"}`,
    `Observações: ${observacoes?.trim() || "Não informado"}`,
  ];

  try {
    const { error } = await resend.emails.send({
      from: "Sonho e Arte em Dimensões <orcamento@sonhoearte3d.com.br>",
      to: destinatario,
      replyTo: email,
      subject: `Novo pedido de orçamento de ${nome}`,
      text: linhas.join("\n"),
      attachments: arquivo
        ? [{ filename: arquivo.nome, content: Buffer.from(arquivo.conteudo, "base64") }]
        : undefined,
    });

    if (error) {
      console.error("Erro retornado pelo Resend:", error);
      res.status(502).json({ error: "Não foi possível enviar o e-mail" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail de orçamento:", error);
    res.status(500).json({ error: "Não foi possível enviar o e-mail" });
  }
}
