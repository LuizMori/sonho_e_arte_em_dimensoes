import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function notificarAdminPedidoPago(supabase: SupabaseClient, orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.CONTACT_EMAIL;
  if (!apiKey || !destinatario) return;

  const { data: pedido } = await supabase
    .from("orders")
    .select("*, profiles(nome, email), order_items(*, products(nome))")
    .eq("id", orderId)
    .maybeSingle();

  if (!pedido) return;

  const endereco = pedido.endereco_json ?? {};
  const linhas = [
    `Pedido: #${pedido.id.slice(0, 8)}`,
    `Status do pagamento: Pago`,
    "",
    `Cliente: ${pedido.profiles?.nome ?? "Não informado"}`,
    `E-mail: ${pedido.profiles?.email ?? "Não informado"}`,
    `Telefone: ${pedido.telefone ?? "Não informado"}`,
    "",
    "Produtos:",
    ...pedido.order_items.map(
      (item: { quantidade: number; preco_unitario: number; products?: { nome: string } | null; nome_produto?: string | null }) =>
        `  ${item.quantidade}x ${item.products?.nome ?? item.nome_produto ?? "Produto"} — ${formatarMoeda(item.preco_unitario * item.quantidade)}`
    ),
    "",
    `Subtotal: ${formatarMoeda(pedido.subtotal)}`,
    `Frete: ${formatarMoeda(pedido.frete_valor)}`,
    `Total: ${formatarMoeda(pedido.total)}`,
    "",
    "Endereço de entrega:",
    `  ${endereco.logradouro ?? ""}, ${endereco.numero ?? ""}${endereco.complemento ? ` — ${endereco.complemento}` : ""}`,
    `  ${endereco.bairro ?? ""} — ${endereco.cidade ?? ""}/${endereco.estado ?? ""}`,
    `  CEP ${pedido.cep_destino}`,
  ];

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "Sonho e Arte em Dimensões <pedidos@sonhoearte3d.com.br>",
      to: destinatario,
      subject: `Novo pedido pago — #${pedido.id.slice(0, 8)}`,
      text: linhas.join("\n"),
    });
  } catch (err) {
    console.error("Erro ao enviar e-mail de notificação de pedido pago:", err);
  }
}

function validarAssinatura(req: VercelRequest, secret: string, dataId: string): boolean {
  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const reqId = Array.isArray(requestId) ? requestId[0] : requestId;

  if (!signature || !reqId) return false;

  const partes = Object.fromEntries(
    signature.split(",").map((parte) => {
      const [chave, valor] = parte.split("=").map((s) => s.trim());
      return [chave, valor];
    })
  );

  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${reqId};ts:${ts};`;
  const hashCalculado = createHmac("sha256", secret).update(manifest).digest("hex");

  const bufCalculado = Buffer.from(hashCalculado, "hex");
  const bufRecebido = Buffer.from(v1, "hex");
  if (bufCalculado.length !== bufRecebido.length) return false;

  return timingSafeEqual(bufCalculado, bufRecebido);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!supabaseUrl || !supabaseKey || !mpAccessToken || !webhookSecret) {
    console.error("Variáveis de ambiente do Mercado Pago não configuradas");
    res.status(500).json({ error: "Webhook não configurado" });
    return;
  }

  const tipo = req.body?.type ?? req.body?.topic;
  const dataId =
    (typeof req.query["data.id"] === "string" ? req.query["data.id"] : undefined) ??
    req.body?.data?.id ??
    req.body?.resource;

  if (tipo !== "payment" || !dataId) {
    // Outros tipos de notificação (merchant_order, etc.) são reconhecidos mas ignorados.
    res.status(200).json({ ok: true });
    return;
  }

  if (!validarAssinatura(req, webhookSecret, String(dataId))) {
    console.error("Assinatura do webhook do Mercado Pago inválida");
    res.status(401).json({ error: "Assinatura inválida" });
    return;
  }

  try {
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!paymentResponse.ok) {
      throw new Error(`Mercado Pago respondeu ${paymentResponse.status} ao consultar o pagamento`);
    }

    const payment = await paymentResponse.json();
    const orderId = payment.external_reference;

    if (payment.status === "approved" && orderId) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Evita notificar de novo se a sincronização automática do client já confirmou este pedido.
      const { data: pedidoAtual } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();
      const jaEstavaPago = pedidoAtual?.status === "paid";

      const { error } = await supabase.rpc("confirmar_pagamento_pedido", {
        p_order_id: orderId,
        p_payment_id: String(dataId),
      });
      if (error) throw error;

      if (!jaEstavaPago) {
        await notificarAdminPedidoPago(supabase, orderId);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err);
    // Responde 500 para que o Mercado Pago tente novamente mais tarde (erro pode ser transitório).
    res.status(500).json({ ok: false });
  }
}
