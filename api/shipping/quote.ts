import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface QuoteItemPayload {
  productId: string;
  quantidade: number;
}

interface QuotePayload {
  cepDestino: string;
  itens: QuoteItemPayload[];
}

interface MelhorEnvioOpcao {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company?: { name: string };
  error?: string;
}

// Só as transportadoras que o estúdio realmente consegue atender no local de coleta.
const TRANSPORTADORAS_PERMITIDAS = ["correios", "jadlog", "loggi"];

interface OpcaoFrete {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number;
}

interface ItemFrete {
  quantidade: number;
  pesoG: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
}

async function cotarFrete(cepOrigem: string, cepDestino: string, itens: ItemFrete[]): Promise<OpcaoFrete[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado");

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

  if (!response.ok) {
    throw new Error(`Melhor Envio respondeu ${response.status}`);
  }

  const data = (await response.json()) as MelhorEnvioOpcao[];

  return data
    .filter((opcao) => !opcao.error && opcao.price)
    .filter((opcao) =>
      TRANSPORTADORAS_PERMITIDAS.some((nome) => opcao.company?.name?.toLowerCase().includes(nome))
    )
    .map((opcao) => ({
      id: String(opcao.id),
      nome: opcao.name,
      transportadora: opcao.company?.name ?? "",
      valor: Number(opcao.price),
      prazoDias: opcao.delivery_time,
    }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido" });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cepOrigem = process.env.CEP_ORIGEM;

  if (!supabaseUrl || !supabaseKey || !cepOrigem) {
    console.error("VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou CEP_ORIGEM não configurados");
    res.status(500).json({ error: "Serviço de frete não configurado" });
    return;
  }

  const payload = req.body as QuotePayload;
  const { cepDestino, itens } = payload ?? {};

  if (!cepDestino || !/^\d{8}$/.test(cepDestino.replace(/\D/g, "")) || !itens || itens.length === 0) {
    res.status(400).json({ error: "Informe um CEP de destino válido e os itens do carrinho" });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const ids = itens.map((item) => item.productId);
    const { data: produtos, error } = await supabase
      .from("products")
      .select("id, peso_g, altura_cm, largura_cm, comprimento_cm")
      .in("id", ids);

    if (error || !produtos) {
      throw error ?? new Error("Produtos não encontrados");
    }

    const itensFrete: ItemFrete[] = itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.productId);
      if (!produto) throw new Error(`Produto ${item.productId} não encontrado`);
      return {
        quantidade: item.quantidade,
        pesoG: produto.peso_g,
        alturaCm: produto.altura_cm,
        larguraCm: produto.largura_cm,
        comprimentoCm: produto.comprimento_cm,
      };
    });

    const opcoes = await cotarFrete(cepOrigem, cepDestino, itensFrete);
    res.status(200).json({ opcoes });
  } catch (err) {
    console.error("Erro ao cotar frete:", err);
    res.status(502).json({ error: "Não foi possível calcular o frete" });
  }
}
