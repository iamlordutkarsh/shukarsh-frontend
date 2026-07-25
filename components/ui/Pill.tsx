import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type PillTone = "lavender" | "blush" | "peach" | "mint" | "ink" | "glass";

const tones: Record<PillTone, string> = {
  lavender: "bg-lavender-100 text-lavender-700",
  blush: "bg-blush-100 text-blush-500",
  peach: "bg-peach-100 text-peach-400",
  mint: "bg-mint-100 text-mint-400",
  ink: "bg-ink-900 text-white",
  glass: "glass text-ink hairline",
};

export function Pill({
  children,
  tone = "lavender",
  className,
}: {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
