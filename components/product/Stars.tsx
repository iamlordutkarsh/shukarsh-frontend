import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-[1.125rem] w-[1.125rem]",
  lg: "h-6 w-6",
} as const;

/**
 * A rating drawn as five stars, filled to a fraction of the way across.
 *
 * Two rows of stars, the gold one clipped to a percentage width. Rounding to
 * whole or half stars instead would draw four stars beside the number 4.4, and a
 * picture that disagrees with the figure printed next to it reads as a bug.
 */
export function Stars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  const star = cn(sizes[size], "shrink-0");

  return (
    <span className={cn("relative inline-flex", className)} aria-hidden>
      <span className="flex">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} className={cn(star, "text-lavender-200")} strokeWidth={2} />
        ))}
      </span>

      <span className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width: `${percent}%` }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Star key={index} className={cn(star, "fill-peach-400 text-peach-400")} strokeWidth={2} />
        ))}
      </span>
    </span>
  );
}

/** The figure and the picture together, which is how a rating is read. */
export function RatingLine({
  average,
  count,
  size = "sm",
  className,
}: {
  average: number;
  count: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Stars value={average} size={size} />
      <span className="text-[0.8125rem] font-semibold text-ink">{average.toFixed(1)}</span>
      <span className="text-xs text-muted">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </span>
  );
}
