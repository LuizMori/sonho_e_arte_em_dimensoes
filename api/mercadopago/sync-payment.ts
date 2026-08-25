import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface SyncPaymentPayload {
  orderId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;

  if (!supabaseUrl || !supabaseKey || !mpAccessToken) {
    console.error("VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou MP_ACCESS_TOKEN não configurados");
    res.status(500).json({ error: "Serviço de pagamento não configurado" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "É necessário estar autenticado" });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    res.status(401).json({ error: "Sessão inválida, faça login novamente" });
    return;
  }

  const payload = req.body as SyncPaymentPayload;
  const orderId = payload?.orderId;
  if (!orderId) {
    res.status(400).json({ error: "Informe o pedido" });
    return;
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      res.status(404).json({ error: "Pedido não encontrado" });
      return;
    }
    if (order.user_id !== user.id) {
      res.status(403).json({ error: "Este pedido não pertence a você" });
      return;
    }

    // Já resolvido (pago, cancelado, expirado) — nada a sincronizar.
    if (order.status !== "pending_payment") {
      res.status(200).json({ status: order.status });
      return;
    }

    const searchResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${orderId}`,
      { headers: { Authorization: `Bearer ${mpAccessToken}` } }
    );

    if (!searchResponse.ok) {
      throw new Error(`Mercado Pago respondeu ${searchResponse.status} ao buscar pagamentos`);
    }

    const search = await searchResponse.json();
    const pagamentoAprovado = (search.results ?? []).find((p: { status: string }) => p.status === "approved");

    if (pagamentoAprovado) {
      const { error: rpcError } = await supabase.rpc("confirmar_pagamento_pedido", {
        p_order_id: orderId,
        p_payment_id: String(pagamentoAprovado.id),
      });
      if (rpcError) throw rpcError;
      res.status(200).json({ status: "paid" });
      return;
    }

    res.status(200).json({ status: "pending_payment" });
  } catch (err) {
    console.error("Erro ao sincronizar pagamento:", err);
    res.status(502).json({ error: "Não foi possível verificar o pagamento" });
  }
}
