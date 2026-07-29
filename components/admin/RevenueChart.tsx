"use client";

import { formatPrice } from "../../lib/utils";

function label(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Daily takings as bars.
 *
 * Drawn by hand rather than pulled from a charting library: the whole front end
 * runs on seven dependencies, and none of them weigh what a chart package does for
 * one screen only the shop ever sees.
 */
export function RevenueChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No paid orders in this window yet. The chart fills in as they arrive.
      </p>
    );
  }

  const peak = Math.max(...data.map((point) => point.revenue), 1);
  // Wide bars look silly across a week and unreadable across three months, so the
  // gap does the adapting rather than the count.
  const gap = data.length > 45 ? 1 : data.length > 14 ? 2 : 4;

  return (
    <div>
      <div className="flex h-44 items-end gap-[var(--bar-gap)]" style={{ "--bar-gap": `${gap}px` } as never}>
        {data.map((point) => (
          <div
            key={point.day}
            className="group relative flex-1"
            style={{ height: `${Math.max(2, (point.revenue / peak) * 100)}%` }}
          >
            <div className="h-full w-full rounded-t-md bg-gradient-to-t from-lavender-300 to-lavender-500 transition-opacity group-hover:opacity-80" />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow-lift group-hover:block">
              <span className="font-semibold">{formatPrice(point.revenue)}</span>
              <span className="text-white/70">
                {" "}
                · {point.orders} order{point.orders === 1 ? "" : "s"}
              </span>
              <span className="block text-white/70">{label(point.day)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
        <span>{label(data[0]!.day)}</span>
        <span>{label(data[data.length - 1]!.day)}</span>
      </div>
    </div>
  );
}
