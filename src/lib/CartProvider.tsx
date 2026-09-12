import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CharmManiaConfig } from "@/types";

export interface CartItem {
  productId: string;
  quantidade: number;
  cor: string | null;
  variacao: string | null;
  charmMania: CharmManiaConfig | null;
  // Preço unitário já calculado (base + letras + pingentes + caixinha) no momento da
  // montagem — só usado para itens de Charm Mania, já que produto.preco sozinho não reflete
  // o valor real da peça personalizada. O servidor recalcula esse valor de qualquer forma
  // ao criar o pedido; isto é só para exibição no carrinho/checkout.
  precoUnitario: number | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (
    productId: string,
    quantidade?: number,
    cor?: string | null,
    variacao?: string | null,
    charmMania?: CharmManiaConfig | null,
    precoUnitario?: number | null
  ) => void;
  removeItem: (productId: string, cor: string | null, variacao: string | null, charmMania?: CharmManiaConfig | null) => void;
  updateQuantidade: (
    productId: string,
    quantidade: number,
    cor: string | null,
    variacao: string | null,
    charmMania?: CharmManiaConfig | null
  ) => void;
  clear: () => void;
}

const STORAGE_KEY = "sonho-arte-carrinho";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function lerCarrinhoSalvo(): CartItem[] {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    return dados
      .filter(
        (item): item is Omit<CartItem, "cor" | "variacao" | "charmMania" | "precoUnitario"> & {
          cor?: string | null;
          variacao?: string | null;
          charmMania?: CharmManiaConfig | null;
          precoUnitario?: number | null;
        } => typeof item?.productId === "string" && typeof item?.quantidade === "number" && item.quantidade > 0
      )
      .map((item) => ({
        ...item,
        cor: typeof item.cor === "string" ? item.cor : null,
        variacao: typeof item.variacao === "string" ? item.variacao : null,
        charmMania: item.charmMania ?? null,
        precoUnitario: typeof item.precoUnitario === "number" ? item.precoUnitario : null,
      }));
  } catch {
    return [];
  }
}

const mesmoItem = (
  item: CartItem,
  productId: string,
  cor: string | null,
  variacao: string | null,
  charmMania: CharmManiaConfig | null = null
) =>
  item.productId === productId &&
  item.cor === cor &&
  item.variacao === variacao &&
  (item.charmMania?.configId ?? null) === (charmMania?.configId ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => lerCarrinhoSalvo());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (
    productId: string,
    quantidade = 1,
    cor: string | null = null,
    variacao: string | null = null,
    charmMania: CharmManiaConfig | null = null,
    precoUnitario: number | null = null
  ) => {
    setItems((prev) => {
      const existente = prev.find((item) => mesmoItem(item, productId, cor, variacao, charmMania));
      if (existente) {
        return prev.map((item) =>
          mesmoItem(item, productId, cor, variacao, charmMania)
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }
      return [...prev, { productId, quantidade, cor, variacao, charmMania, precoUnitario }];
    });
  };

  const removeItem = (
    productId: string,
    cor: string | null,
    variacao: string | null,
    charmMania: CharmManiaConfig | null = null
  ) => {
    setItems((prev) => prev.filter((item) => !mesmoItem(item, productId, cor, variacao, charmMania)));
  };

  const updateQuantidade = (
    productId: string,
    quantidade: number,
    cor: string | null,
    variacao: string | null,
    charmMania: CharmManiaConfig | null = null
  ) => {
    if (quantidade <= 0) {
      removeItem(productId, cor, variacao, charmMania);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (mesmoItem(item, productId, cor, variacao, charmMania) ? { ...item, quantidade } : item))
    );
  };

  const clear = () => setItems([]);

  const count = items.reduce((total, item) => total + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ items, count, addItem, removeItem, updateQuantidade, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de um CartProvider");
  return context;
}
