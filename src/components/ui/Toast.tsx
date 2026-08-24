import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant: "success" | "error";
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-[min(360px,calc(100vw-3rem))]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`rounded-xl px-5 py-4 shadow-lg animate-fade-up border ${
              toast.variant === "success"
                ? "bg-navy text-cream-light border-navy"
                : "bg-cream-light text-navy border-magenta"
            }`}
          >
            <p className="font-medium text-sm">{toast.title}</p>
            {toast.description && <p className="text-sm opacity-80 mt-1">{toast.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de ToastProvider");
  return ctx;
}
