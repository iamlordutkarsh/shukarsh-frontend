"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { springSoft } from "../../lib/motion";
import { useOverlay } from "../../lib/use-overlay";
import { cn } from "../../lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
  className?: string;
}

export function Modal({ open, onClose, children, label, className }: ModalProps) {
  const { mounted, panelRef } = useOverlay(open, onClose);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[115] grid place-items-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              "relative z-10 w-full max-w-3xl overflow-hidden rounded-5xl bg-surface shadow-lift outline-none hairline",
              className
            )}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.18 } }}
            transition={springSoft}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-muted shadow-soft transition-all hover:rotate-90 hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
