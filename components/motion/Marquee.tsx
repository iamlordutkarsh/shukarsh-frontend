import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

/** Seamless CSS marquee: children are rendered twice and translated -50%. */
export function Marquee({
  children,
  className,
  duration = "38s",
}: {
  children: ReactNode;
  className?: string;
  duration?: string;
}) {
  return (
    <div className={cn("group relative flex overflow-hidden", className)}>
      <div
        className="animate-marquee flex min-w-max shrink-0 items-center group-hover:[animation-play-state:paused]"
        style={{ animationDuration: duration }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
