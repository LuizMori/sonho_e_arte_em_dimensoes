import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  productId: string;
  quantidade: number;
  cor: string | null;
  variacao: string | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (productId: string, quantidade?: number, cor?: string | null, variacao?: string | null) => void;
  removeItem: (productId: string, cor: string | null, variacao: string | null) => void;
  updateQuantidade: (productId: string, quantidade: number, cor: string | null, variacao: string | null) => void;
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
        (item): item is Omit<CartItem, "cor" | "variacao"> & { cor?: string | null; variacao?: string | null } =>
          typeof item?.productId === "string" && typeof item?.quantidade === "number" && item.quantidade > 0
      )
      .map((item) => ({
        ...item,
        cor: typeof item.cor === "string" ? item.cor : null,
        variacao: typeof item.variacao === "string" ? item.variacao : null,
      }));
  } catch {
    return [];
  }
}

const mesmoItem = (item: CartItem, productId: string, cor: string | null, variacao: string | null) =>
  item.productId === productId && item.cor === cor && item.variacao === variacao;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => lerCarrinhoSalvo());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (
    productId: string,
    quantidade = 1,
    cor: string | null = null,
    variacao: string | null = null
  ) => {
    setItems((prev) => {
      const existente = prev.find((item) => mesmoItem(item, productId, cor, variacao));
      if (existente) {
        return prev.map((item) =>
          mesmoItem(item, productId, cor, variacao) ? { ...item, quantidade: item.quantidade + quantidade } : item
        );
      }
      return [...prev, { productId, quantidade, cor, variacao }];
    });
  };

  const removeItem = (productId: string, cor: string | null, variacao: string | null) => {
    setItems((prev) => prev.filter((item) => !mesmoItem(item, productId, cor, variacao)));
  };

  const updateQuantidade = (productId: string, quantidade: number, cor: string | null, variacao: string | null) => {
    if (quantidade <= 0) {
      removeItem(productId, cor, variacao);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (mesmoItem(item, productId, cor, variacao) ? { ...item, quantidade } : item))
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
