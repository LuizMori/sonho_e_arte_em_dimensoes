import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

interface SyncPaymentPayload {
  orderId: string;
}

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface OrderItemParaEmail {
  quantidade: number;
  preco_unitario: number;
  cor?: string | null;
  variacao?: string | null;
  products?: { nome: string } | null;
  nome_produto?: string | null;
  personalizacao?: {
    sequencia: ({ tipo: "letra"; valor: string; cor?: string | null } | { tipo: "pingente"; nome: string; preco: number })[];
    cordao_cor?: string | null;
    caixinha: { incluida: false } | { incluida: true; nome: string; preco: number; cor: string | null };
  } | null;
}

// Descreve um item do pedido para o e-mail do vendedor — sem isso, um pedido de Charm
// Mania chegava pra quem monta a peça sem dizer a palavra, os pingentes ou as cores
// escolhidas (informação que só aparecia pro cliente, nunca pra quem produz).
function descreverItem(item: OrderItemParaEmail): string {
  const nome = item.products?.nome ?? item.nome_produto ?? "Produto";
  const base = `${item.quantidade}x ${nome} — ${formatarMoeda(item.preco_unitario * item.quantidade)}`;

  if (item.personalizacao) {
    const letras = item.personalizacao.sequencia.filter(
      (c): c is { tipo: "letra"; valor: string; cor?: string | null } => c.tipo === "letra"
    );
    // Cor por letra, não só a lista de cores usadas na peça — quem monta precisa saber
    // exatamente qual letra fica em qual cor, não só "usei rosa e roxo em algum lugar".
    const palavraComCores = letras
      .map((c) => (c.cor ? `${c.valor.toUpperCase()}(${c.cor})` : c.valor.toUpperCase()))
      .join(" ");
    const pingentes = item.personalizacao.sequencia
      .filter((c): c is { tipo: "pingente"; nome: string; preco: number } => c.tipo === "pingente")
      .map((c) => c.nome);

    const detalhes = [
      item.personalizacao.cordao_cor ? `cordão ${item.personalizacao.cordao_cor}` : null,
      palavraComCores ? `palavra: ${palavraComCores}` : null,
      pingentes.length > 0 ? `pingentes: ${pingentes.join(", ")}` : null,
      item.personalizacao.caixinha.incluida
        ? `caixinha${item.personalizacao.caixinha.cor ? ` (${item.personalizacao.caixinha.cor})` : ""}`
        : null,
    ].filter(Boolean);

    return detalhes.length > 0 ? `${base}\n     ${detalhes.join(" · ")}` : base;
  }

  const detalheSimples = [item.cor && `cor ${item.cor}`, item.variacao && `variação ${item.variacao}`]
    .filter(Boolean)
    .join(" · ");
  return detalheSimples ? `${base} (${detalheSimples})` : base;
}

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
    ...pedido.order_items.map((item: OrderItemParaEmail) => `  ${descreverItem(item)}`),
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

      await notificarAdminPedidoPago(supabase, orderId);

      res.status(200).json({ status: "paid" });
      return;
    }

    res.status(200).json({ status: "pending_payment" });
  } catch (err) {
    console.error("Erro ao sincronizar pagamento:", err);
    res.status(502).json({ error: "Não foi possível verificar o pagamento" });
  }
}
