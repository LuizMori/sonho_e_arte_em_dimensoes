import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface CreatePreferencePayload {
  orderId: string;
}

interface OrderItemRow {
  quantidade: number;
  preco_unitario: number;
  products: { nome: string } | null;
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

  const payload = req.body as CreatePreferencePayload;
  const orderId = payload?.orderId;
  if (!orderId) {
    res.status(400).json({ error: "Informe o pedido" });
    return;
  }

  try {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
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
    if (order.status !== "pending_payment") {
      res.status(409).json({ error: "Este pedido não está mais aguardando pagamento" });
      return;
    }

    const { data: itens, error: itensError } = await supabase
      .from("order_items")
      .select("quantidade, preco_unitario, products(nome)")
      .eq("order_id", orderId);

    if (itensError || !itens || itens.length === 0) {
      throw itensError ?? new Error("Itens do pedido não encontrados");
    }

    const origin = `https://${req.headers.host}`;

    const items = (itens as unknown as OrderItemRow[]).map((item) => ({
      title: item.products?.nome ?? "Produto",
      quantity: item.quantidade,
      unit_price: Number(item.preco_unitario),
      currency_id: "BRL",
    }));

    if (Number(order.frete_valor) > 0) {
      items.push({
        title: "Frete",
        quantity: 1,
        unit_price: Number(order.frete_valor),
        currency_id: "BRL",
      });
    }

    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({
        items,
        external_reference: order.id,
        // Sem notification_url aqui de propósito: definir por preferência tem prioridade sobre a
        // URL configurada em Suas integrações > Webhooks, mas só essa última tem a assinatura
        // secreta garantida para validar x-signature. Deixamos o Mercado Pago usar a URL do painel.
        back_urls: {
          success: `${origin}/pedido/${order.id}`,
          failure: `${origin}/pedido/${order.id}`,
          pending: `${origin}/pedido/${order.id}`,
        },
        auto_return: "approved",
        // "ticket" é a categoria do Mercado Pago para Boleto/pagamento em lotérica — excluída porque
        // a loja não quer oferecer esse meio de pagamento no checkout.
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }],
        },
      }),
    });

    const preference = await preferenceResponse.json();

    if (!preferenceResponse.ok) {
      console.error("Erro do Mercado Pago ao criar preferência:", preference);
      throw new Error("Mercado Pago recusou a criação da preferência");
    }

    await supabase.from("orders").update({ mp_preference_id: preference.id }).eq("id", order.id);

    // Com credenciais de teste, o Mercado Pago também retorna sandbox_init_point; com produção,
    // normalmente só init_point vem preenchido. Preferir sandbox_init_point quando presente cobre
    // os dois casos sem depender do formato do token.
    const initPoint = preference.sandbox_init_point ?? preference.init_point;

    res.status(200).json({ initPoint });
  } catch (err) {
    console.error("Erro ao criar preferência de pagamento:", err);
    res.status(502).json({ error: "Não foi possível iniciar o pagamento" });
  }
}
