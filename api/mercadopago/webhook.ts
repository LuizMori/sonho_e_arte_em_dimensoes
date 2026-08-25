import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

function validarAssinatura(req: VercelRequest, secret: string): boolean {
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

  const dataId = typeof req.query["data.id"] === "string" ? req.query["data.id"] : req.body?.data?.id;
  if (!dataId) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${reqId};ts:${ts};`;
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

  if (!validarAssinatura(req, webhookSecret)) {
    console.error("Assinatura do webhook do Mercado Pago inválida");
    res.status(401).json({ error: "Assinatura inválida" });
    return;
  }

  const tipo = req.body?.type;
  const dataId = req.body?.data?.id;

  if (tipo !== "payment" || !dataId) {
    // Outros tipos de notificação (merchant_order, etc.) são reconhecidos mas ignorados.
    res.status(200).json({ ok: true });
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
      const { error } = await supabase.rpc("confirmar_pagamento_pedido", {
        p_order_id: orderId,
        p_payment_id: String(dataId),
      });
      if (error) throw error;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err);
    // Responde 500 para que o Mercado Pago tente novamente mais tarde (erro pode ser transitório).
    res.status(500).json({ ok: false });
  }
}
