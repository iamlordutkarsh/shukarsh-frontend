"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { springSnappy } from "../../lib/motion";
import { cn } from "../../lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export function QuantityStepper({
  value,
  onChange,
  max = 10,
  min = 1,
  size = "md",
  className,
  label = "Quantity",
}: QuantityStepperProps) {
  const reduced = useReducedMotion();
  const ceiling = Math.max(min, max);
  const dimension = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "h-9 w-9" : "h-12 w-11";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-between rounded-full bg-surface shadow-soft ring-1 ring-line",
        dimension,
        className
      )}
    >
      <motion.button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        whileTap={reduced ? undefined : { scale: 0.85 }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full text-ink transition-colors hover:text-lavender-600 disabled:opacity-35",
          button
        )}
      >
        <Minus className="h-4 w-4" strokeWidth={2.6} />
      </motion.button>

      <span className="relative min-w-8 overflow-hidden text-center text-sm font-bold tabular-nums text-ink">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={reduced ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: -14, opacity: 0 }}
            transition={springSnappy}
            className="block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>

      <motion.button
        type="button"
        onClick={() => onChange(Math.min(ceiling, value + 1))}
        disabled={value >= ceiling}
        aria-label="Increase quantity"
        whileTap={reduced ? undefined : { scale: 0.85 }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full text-ink transition-colors hover:text-lavender-600 disabled:opacity-35",
          button
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} />
      </motion.button>
    </div>
  );
}
