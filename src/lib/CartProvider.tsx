import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface CartItem {
  productId: string;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (productId: string, quantidade?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantidade: (productId: string, quantidade: number) => void;
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
    return dados.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" && typeof item?.quantidade === "number" && item.quantidade > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => lerCarrinhoSalvo());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (productId: string, quantidade = 1) => {
    setItems((prev) => {
      const existente = prev.find((item) => item.productId === productId);
      if (existente) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantidade: item.quantidade + quantidade } : item
        );
      }
      return [...prev, { productId, quantidade }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantidade = (productId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantidade } : item)));
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
