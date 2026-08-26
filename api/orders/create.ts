import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface CreateOrderItemPayload {
  productId: string;
  quantidade: number;
  cor?: string | null;
  variacao?: string | null;
}

interface EnderecoPayload {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CreateOrderPayload {
  itens: CreateOrderItemPayload[];
  cepDestino: string;
  freteValor: number;
  freteNome: string;
  telefone: string;
  endereco: EnderecoPayload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
    res.status(500).json({ error: "Serviço de pedidos não configurado" });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "É necessário estar autenticado para finalizar o pedido" });
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

  const payload = req.body as CreateOrderPayload;
  const { itens, cepDestino, freteValor, freteNome, telefone, endereco } = payload ?? {};

  if (!itens || itens.length === 0 || !cepDestino || typeof freteValor !== "number" || !telefone) {
    res.status(400).json({ error: "Dados do pedido incompletos" });
    return;
  }

  if (!endereco?.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade || !endereco.estado) {
    res.status(400).json({ error: "Informe o endereço de entrega completo" });
    return;
  }

  try {
    const { data: orderId, error } = await supabase.rpc("criar_pedido", {
      p_user_id: user.id,
      p_itens: itens.map((item) => ({
        product_id: item.productId,
        quantidade: item.quantidade,
        cor: item.cor ?? null,
        variacao: item.variacao ?? null,
      })),
      p_cep_destino: cepDestino,
      p_frete_valor: freteValor,
      p_frete_nome: freteNome ?? "",
      p_telefone: telefone,
      p_endereco: endereco,
    });

    if (error) throw error;

    res.status(200).json({ orderId });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    const message =
      err && typeof err === "object" && "message" in err && typeof err.message === "string"
        ? err.message
        : "Não foi possível criar o pedido";
    res.status(409).json({ error: message });
  }
}
