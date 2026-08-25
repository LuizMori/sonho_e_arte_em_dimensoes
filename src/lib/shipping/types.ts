export interface ShippingQuoteItem {
  quantidade: number;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
}

export interface ShippingQuoteRequest {
  cepOrigem: string;
  cepDestino: string;
  itens: ShippingQuoteItem[];
}

export interface ShippingOption {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number;
}
