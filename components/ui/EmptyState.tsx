import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  art: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ art, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-5xl bg-surface/80 text-center hairline shadow-soft",
        compact ? "gap-4 px-6 py-10" : "gap-5 px-8 py-16",
        className
      )}
    >
      <div className={cn("animate-float-slow", compact ? "w-36" : "w-52")}>{art}</div>
      <div className="space-y-2">
        <h3 className={cn("font-display text-ink", compact ? "text-lg" : "text-2xl")}>{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
