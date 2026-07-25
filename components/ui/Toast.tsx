"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Heart, Info, ShoppingBag, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { springSoft } from "../../lib/motion";
import { useHydrated } from "../../lib/use-hydrated";
import { cn } from "../../lib/utils";

type ToastTone = "success" | "error" | "info" | "cart" | "wishlist";

interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: number;
  tone: ToastTone;
  duration: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: ReactNode; ring: string; glow: string }> = {
  success: {
    icon: <Check className="h-4 w-4" strokeWidth={3} />,
    ring: "bg-mint-400 text-white",
    glow: "shadow-[0_18px_40px_-20px_rgb(111_216_184/0.7)]",
  },
  error: {
    icon: <TriangleAlert className="h-4 w-4" strokeWidth={2.6} />,
    ring: "bg-rose-400 text-white",
    glow: "shadow-[0_18px_40px_-20px_rgb(251_113_133/0.7)]",
  },
  info: {
    icon: <Info className="h-4 w-4" strokeWidth={2.6} />,
    ring: "bg-lavender-500 text-white",
    glow: "shadow-[0_18px_40px_-20px_rgb(139_107_255/0.7)]",
  },
  cart: {
    icon: <ShoppingBag className="h-4 w-4" strokeWidth={2.4} />,
    ring: "bg-gradient-to-br from-lavender-500 to-blush-400 text-white",
    glow: "shadow-glow",
  },
  wishlist: {
    icon: <Heart className="h-4 w-4" strokeWidth={2.4} fill="currentColor" />,
    ring: "bg-blush-400 text-white",
    glow: "shadow-glow",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const mounted = useHydrated();
  const timers = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "info", duration = 3600 }: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, title, description, tone, duration }]);
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex flex-col items-center gap-3 px-4 sm:bottom-7 sm:right-7 sm:left-auto sm:items-end sm:px-0"
            role="region"
            aria-label="Notifications"
          >
            <AnimatePresence initial={false}>
              {toasts.map((item) => {
                const tone = toneStyles[item.tone];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 26, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={springSoft}
                    className={cn(
                      "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-3xl bg-surface/95 p-4 pr-11 glass-strong hairline",
                      tone.glow
                    )}
                    role="status"
                    aria-live="polite"
                  >
                    <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", tone.ring)}>
                      {tone.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(item.id)}
                      aria-label="Dismiss notification"
                      className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <motion.span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-lavender-400 to-blush-400"
                      initial={{ scaleX: 1 }}
                      animate={{ scaleX: 0 }}
                      transition={{ duration: item.duration / 1000, ease: "linear" }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
