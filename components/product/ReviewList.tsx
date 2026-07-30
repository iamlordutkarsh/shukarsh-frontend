import { BadgeCheck } from "lucide-react";
import type { RatingSummary, Review } from "../../lib/types";
import { Stars } from "./Stars";

/**
 * A month and a year. The day a review was written adds nothing, and a full
 * timestamp beside somebody's first name is more precision about a person than
 * the page needs.
 */
const monthYear = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function reviewDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : monthYear.format(date);
}

/**
 * Rendered on the server, on purpose.
 *
 * Reviews are the most useful text on a product page and the part a search
 * engine most wants to read. Fetching them in the browser after paint would hide
 * all of it from a crawler and push the page's own content below an empty box.
 */
export function ReviewList({ reviews, summary }: { reviews: Review[]; summary: RatingSummary }) {
  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-section text-balance">What customers say</h2>

        {summary.average != null && summary.count > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-ink">{summary.average.toFixed(1)}</span>
            <div>
              <Stars value={summary.average} size="md" />
              <p className="text-xs text-muted">
                {summary.count} review{summary.count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-muted">
        <BadgeCheck className="h-4 w-4 shrink-0 text-mint-400" strokeWidth={2.4} />
        Only customers we have delivered this to can write one.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface/70 px-5 py-6 text-sm text-muted hairline">
          No reviews yet. Once yours arrives, you can be the first to say something.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-3xl bg-surface/70 px-5 py-4 hairline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Stars value={review.rating} />
                  <span className="text-[0.8125rem] font-bold text-ink">{review.author}</span>
                </div>
                <span className="text-xs text-faint">{reviewDate(review.createdAt)}</span>
              </div>

              {review.comment && (
                <p className="mt-2 text-pretty text-[0.9375rem] leading-relaxed text-ink-700">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
