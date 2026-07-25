"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { easeSoft } from "../../lib/motion";
import { useOverlay } from "../../lib/use-overlay";
import { cn } from "../../lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "right" | "left";
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
  const { mounted, panelRef } = useOverlay(open, onClose);
  if (!mounted) return null;

  const offscreen = side === "right" ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex" role="dialog" aria-modal="true" aria-label={description ?? undefined}>
          <motion.div
            className="absolute inset-0 bg-ink-900/35 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              "relative ml-auto flex h-full w-full max-w-md flex-col bg-canvas/95 shadow-lift outline-none glass-strong",
              side === "left" && "ml-0 mr-auto",
              className
            )}
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ duration: 0.42, ease: easeSoft }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0">
                <h2 className="font-display text-xl text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-muted shadow-soft transition-all hover:rotate-90 hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>

            {footer && <footer className="border-t border-line bg-surface/80 px-6 py-5">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
