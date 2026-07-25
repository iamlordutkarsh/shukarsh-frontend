import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Reveal } from "../motion/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start",
        action && align === "left" && "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto")}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-lavender-100/80 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-lavender-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blush-400" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-section text-balance">{title}</h2>
        {description && <p className="text-pretty text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </Reveal>
  );
}
