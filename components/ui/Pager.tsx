"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface PagerProps {
  page: number;
  pages: number;
  total: number;
  /** What is being counted, singular. "order" reads as "1–50 of 214 orders". */
  noun: string;
  /** How many are on screen right now, which is not `limit` on the last page. */
  showing: number;
  limit: number;
  onPage: (page: number) => void;
  busy?: boolean;
}

/**
 * Where you are in a list, and how to get somewhere else in it.
 *
 * Says the range and the total rather than only offering arrows, because the
 * thing a pager most needs to answer is "is what I am looking for even on this
 * screen" — and a queue that has quietly been capped looks identical to a queue
 * that is genuinely short until something says how many there are.
 */
export function Pager({ page, pages, total, noun, showing, limit, onPage, busy }: PagerProps) {
  if (pages <= 1) return null;

  const first = (page - 1) * limit + 1;
  const last = first + showing - 1;

  const step = (to: number) => () => {
    if (to >= 1 && to <= pages && !busy) onPage(to);
  };

  const button =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label={`${noun} pages`}
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-4xl bg-surface/90 px-5 py-3.5 shadow-soft hairline"
    >
      <p className="text-xs text-muted" aria-live="polite">
        <span className="font-semibold text-ink">
          {first.toLocaleString("en-IN")}–{last.toLocaleString("en-IN")}
        </span>{" "}
        of {total.toLocaleString("en-IN")} {noun}
        {total === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={step(page - 1)}
          disabled={page <= 1 || busy}
          className={cn(button, "bg-surface text-muted hairline hover:text-ink")}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.6} />
          Back
        </button>

        {pageNumbers(page, pages).map((entry, index) =>
          entry === null ? (
            <span key={`gap-${index}`} aria-hidden className="px-1 text-xs text-faint">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={step(entry)}
              disabled={busy}
              aria-current={entry === page ? "page" : undefined}
              aria-label={`Page ${entry}`}
              className={cn(
                button,
                entry === page
                  ? "bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-soft"
                  : "bg-surface text-muted hairline hover:text-ink"
              )}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          onClick={step(page + 1)}
          disabled={page >= pages || busy}
          className={cn(button, "bg-surface text-muted hairline hover:text-ink")}
        >
          Next
          <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
    </nav>
  );
}

/**
 * The page numbers worth showing: the ends, and a window around where you are.
 *
 * `null` is a gap. Always the same shape once there are enough pages to need
 * one, so the buttons do not shuffle sideways under the cursor as you page
 * through — which is how you end up on page 9 having aimed at 7.
 */
function pageNumbers(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);

  const window = new Set([1, pages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((entry) => window.add(entry));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((entry) => window.add(entry));

  const shown = [...window].filter((entry) => entry >= 1 && entry <= pages).sort((a, b) => a - b);

  const withGaps: (number | null)[] = [];
  for (const [index, entry] of shown.entries()) {
    if (index > 0 && entry - shown[index - 1]! > 1) withGaps.push(null);
    withGaps.push(entry);
  }

  return withGaps;
}
