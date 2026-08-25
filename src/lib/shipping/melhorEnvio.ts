import type { ShippingOption, ShippingQuoteRequest } from "./types";

const BASE_URL = process.env.MELHOR_ENVIO_API_URL || "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

interface MelhorEnvioOpcao {
  id: number;
  name: string;
  price: string;
  delivery_time: number;
  company?: { name: string };
  error?: string;
}

export async function cotarFrete(request: ShippingQuoteRequest): Promise<ShippingOption[]> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado");

  const body = {
    from: { postal_code: request.cepOrigem.replace(/\D/g, "") },
    to: { postal_code: request.cepDestino.replace(/\D/g, "") },
    products: request.itens.map((item, index) => ({
      id: String(index),
      width: item.larguraCm,
      height: item.alturaCm,
      length: item.comprimentoCm,
      weight: item.pesoKg,
      quantity: item.quantidade,
      insurance_value: 0,
    })),
  };

  const response = await fetch(BASE_URL, {
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
    .map((opcao) => ({
      id: String(opcao.id),
      nome: opcao.name,
      transportadora: opcao.company?.name ?? "",
      valor: Number(opcao.price),
      prazoDias: opcao.delivery_time,
    }));
}
