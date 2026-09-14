import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

type Bead = { tipo: "letra"; valor: string; cor?: string | null } | { tipo: "pingente"; charmId: string };

interface CreateOrderItemPayload {
  productId: string;
  quantidade: number;
  cor?: string | null;
  variacao?: string | null;
  personalizacao?: {
    sequencia: Bead[];
    cordaoCor?: string | null;
    caixinha: boolean;
    caixinhaCor?: string | null;
  } | null;
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

interface MelhorEnvioOpcao {
  price?: string;
  error?: string;
}

// Mesma chamada de cotação usada em api/shipping/quote.ts (duplicada aqui porque cada função
// serverless da Vercel precisa ser autocontida — sem import de src/lib). Serve só para
// revalidar que o freteValor enviado pelo client bate com uma cotação real, já que o client
// nunca deve ser a fonte da verdade do valor cobrado — mesmo princípio já aplicado ao preço
// dos produtos.
async function freteValorEhValido(
  cepOrigem: string,
  cepDestino: string,
  itens: { pesoG: number; alturaCm: number; larguraCm: number; comprimentoCm: number; quantidade: number }[],
  freteValor: number
): Promise<boolean> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return false;

  const baseUrl = process.env.MELHOR_ENVIO_API_URL || "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

  const body = {
    from: { postal_code: cepOrigem.replace(/\D/g, "") },
    to: { postal_code: cepDestino.replace(/\D/g, "") },
    products: itens.map((item, index) => ({
      id: String(index),
      width: item.larguraCm,
      height: item.alturaCm,
      length: item.comprimentoCm,
      weight: item.pesoG / 1000,
      quantity: item.quantidade,
      insurance_value: 0,
    })),
  };

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Sonho e Arte em Dimensões (contato@sonhoearte3d.com.br)",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return false;

  const opcoes = (await response.json()) as MelhorEnvioOpcao[];
  const valores = opcoes.filter((o) => !o.error && o.price).map((o) => Number(o.price));

  // Tolerância pequena pra absorver arredondamento de centavos entre a cotação exibida no
  // checkout e esta revalidação — não pra permitir manipulação real do valor.
  return valores.some((valor) => Math.abs(valor - freteValor) < 0.05);
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

  const cepOrigem = process.env.CEP_ORIGEM;
  if (!cepOrigem) {
    console.error("CEP_ORIGEM não configurado");
    res.status(500).json({ error: "Serviço de pedidos não configurado" });
    return;
  }

  const { data: produtosFrete, error: erroProdutosFrete } = await supabase
    .from("products")
    .select("id, peso_g, altura_cm, largura_cm, comprimento_cm")
    .in(
      "id",
      itens.map((item) => item.productId)
    );

  if (erroProdutosFrete || !produtosFrete) {
    res.status(400).json({ error: "Não foi possível validar o frete" });
    return;
  }

  const itensFrete = itens.map((item) => {
    const produto = produtosFrete.find((p) => p.id === item.productId);
    return {
      quantidade: item.quantidade,
      pesoG: produto?.peso_g ?? 0,
      alturaCm: produto?.altura_cm ?? 0,
      larguraCm: produto?.largura_cm ?? 0,
      comprimentoCm: produto?.comprimento_cm ?? 0,
    };
  });

  const freteValido = await freteValorEhValido(cepOrigem, cepDestino, itensFrete, freteValor).catch((err) => {
    console.error("Erro ao revalidar frete:", err);
    return false;
  });

  if (!freteValido) {
    res.status(400).json({ error: "O valor do frete mudou, atualize a página e tente novamente" });
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
        personalizacao: item.personalizacao ?? null,
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
