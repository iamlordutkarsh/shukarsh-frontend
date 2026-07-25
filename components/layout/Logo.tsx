import Link from "next/link";
import { cn } from "../../lib/utils";

export function Logo({ className, invert = false }: { className?: string; invert?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Shukarsh home"
      className={cn("group inline-flex items-baseline gap-1 font-display text-2xl leading-none tracking-tight", className)}
    >
      <span className={invert ? "text-white" : "text-ink"}>Shukarsh</span>
      <span
        aria-hidden
        className="relative inline-block h-2 w-2 rounded-full bg-gradient-to-br from-blush-400 to-peach-300 transition-transform duration-500 ease-[var(--ease-bouncy)] group-hover:-translate-y-1.5 group-hover:scale-125"
      />
    </Link>
  );
}
