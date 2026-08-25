import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { cotarFrete } from "../../src/lib/shipping/melhorEnvio";

interface QuoteItemPayload {
  productId: string;
  quantidade: number;
}

interface QuotePayload {
  cepDestino: string;
  itens: QuoteItemPayload[];
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
      .select("id, peso_kg, altura_cm, largura_cm, comprimento_cm")
      .in("id", ids);

    if (error || !produtos) {
      throw error ?? new Error("Produtos não encontrados");
    }

    const itensFrete = itens.map((item) => {
      const produto = produtos.find((p) => p.id === item.productId);
      if (!produto) throw new Error(`Produto ${item.productId} não encontrado`);
      return {
        quantidade: item.quantidade,
        pesoKg: produto.peso_kg,
        alturaCm: produto.altura_cm,
        larguraCm: produto.largura_cm,
        comprimentoCm: produto.comprimento_cm,
      };
    });

    const opcoes = await cotarFrete({ cepOrigem, cepDestino, itens: itensFrete });
    res.status(200).json({ opcoes });
  } catch (err) {
    console.error("Erro ao cotar frete:", err);
    res.status(502).json({ error: "Não foi possível calcular o frete" });
  }
}
