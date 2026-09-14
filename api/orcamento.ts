import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
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

// Extensões esperadas para um pedido de orçamento de impressão 3D (arquivo de modelo, ou
// imagem/PDF de referência) — evita que o formulário público seja usado pra anexar e
// distribuir qualquer tipo de arquivo (executáveis, scripts) pelo e-mail da loja.
const EXTENSOES_ANEXO_PERMITIDAS = [
  "stl", "obj", "3mf", "step", "stp", "zip",
  "jpg", "jpeg", "png", "gif", "webp", "pdf",
];

function extensaoPermitida(nomeArquivo: string): boolean {
  const extensao = nomeArquivo.split(".").pop()?.toLowerCase();
  return Boolean(extensao) && EXTENSOES_ANEXO_PERMITIDAS.includes(extensao!);
}

// Checagem pelo início real do arquivo (magic bytes), não só pela extensão do nome — um
// "malware.exe" renomeado para "modelo.stl" passaria pela checagem de extensão sozinha.
// Assinaturas de executáveis/scripts são bloqueadas para qualquer extensão; STL/OBJ/STEP não
// têm um magic byte fixo (são texto ou binário livre), então para esses só o bloqueio abaixo
// se aplica — os demais formatos exigem também bater com a assinatura esperada.
const ASSINATURAS_PERIGOSAS: Buffer[] = [
  Buffer.from([0x4d, 0x5a]), // "MZ" — executável do Windows (.exe, .dll)
  Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // "\x7fELF" — executável do Linux
  Buffer.from("#!", "ascii"), // shebang de script (.sh, .py, etc.)
];

const ASSINATURAS_POR_EXTENSAO: Record<string, Buffer[]> = {
  pdf: [Buffer.from("%PDF", "ascii")],
  png: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  jpg: [Buffer.from([0xff, 0xd8, 0xff])],
  jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
  gif: [Buffer.from("GIF8", "ascii")],
  zip: [Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from([0x50, 0x4b, 0x05, 0x06])],
  "3mf": [Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from([0x50, 0x4b, 0x05, 0x06])], // 3MF é um pacote ZIP
};

function comecaCom(conteudo: Buffer, assinatura: Buffer): boolean {
  return conteudo.length >= assinatura.length && conteudo.subarray(0, assinatura.length).equals(assinatura);
}

function conteudoCompativel(nomeArquivo: string, conteudoBase64: string): boolean {
  const extensao = nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
  const cabecalho = Buffer.from(conteudoBase64.slice(0, 64), "base64");

  if (ASSINATURAS_PERIGOSAS.some((assinatura) => comecaCom(cabecalho, assinatura))) {
    return false;
  }

  if (extensao === "webp") {
    return comecaCom(cabecalho, Buffer.from("RIFF", "ascii")) && cabecalho.subarray(8, 12).toString("ascii") === "WEBP";
  }

  const assinaturasEsperadas = ASSINATURAS_POR_EXTENSAO[extensao];
  if (!assinaturasEsperadas) return true; // stl, obj, step, stp: sem magic byte fixo, só o bloqueio acima se aplica
  return assinaturasEsperadas.some((assinatura) => comecaCom(cabecalho, assinatura));
}

const LIMITE_TENTATIVAS = 5;
const JANELA_MS = 10 * 60 * 1000; // 10 minutos

function ipDoRequest(req: VercelRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const primeiro = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return primeiro?.split(",")[0]?.trim() || req.socket.remoteAddress || "desconhecido";
}

// Endpoint público e sem autenticação: sem isso, dá pra automatizar chamadas e usar a caixa
// de CONTACT_EMAIL pra spam (aqui, ainda pior — com anexo, gastando a cota de envio do
// Resend). Cada linha em rate_limits é uma tentativa; se já houver LIMITE_TENTATIVAS na
// janela recente para o mesmo IP+endpoint, bloqueia. Falha aberta (não bloqueia) se o
// Supabase não estiver configurado, pra não derrubar o formulário por causa só do rate limit.
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

  if (await limiteExcedido(`orcamento:${ipDoRequest(req)}`)) {
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

  if (arquivo && !extensaoPermitida(arquivo.nome)) {
    res.status(400).json({ error: "Tipo de arquivo não aceito. Envie STL, OBJ, 3MF, STEP, ZIP, PDF ou imagem." });
    return;
  }

  if (arquivo && !conteudoCompativel(arquivo.nome, arquivo.conteudo)) {
    res.status(400).json({ error: "O conteúdo do arquivo não corresponde ao tipo esperado." });
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
