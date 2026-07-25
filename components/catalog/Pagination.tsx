import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function Pagination({
  page,
  pages,
  buildHref,
}: {
  page: number;
  pages: number;
  buildHref: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const windowStart = Math.max(1, Math.min(page - 1, pages - 2));
  const visible = Array.from({ length: Math.min(3, pages) }, (_, index) => windowStart + index).filter(
    (value) => value <= pages
  );

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-soft ring-1 ring-line transition-all hover:ring-lavender-300",
          page === 1 && "pointer-events-none opacity-40"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
      </Link>

      {visible[0] !== 1 && (
        <>
          <Link
            href={buildHref(1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-surface text-sm font-semibold text-ink shadow-soft ring-1 ring-line"
          >
            1
          </Link>
          <span className="px-1 text-faint">…</span>
        </>
      )}

      {visible.map((value) => (
        <Link
          key={value}
          href={buildHref(value)}
          aria-current={value === page ? "page" : undefined}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full text-sm font-semibold transition-all",
            value === page
              ? "bg-gradient-to-br from-lavender-500 to-blush-400 text-white shadow-glow"
              : "bg-surface text-ink shadow-soft ring-1 ring-line hover:ring-lavender-300"
          )}
        >
          {value}
        </Link>
      ))}

      {visible[visible.length - 1] !== pages && (
        <>
          <span className="px-1 text-faint">…</span>
          <Link
            href={buildHref(pages)}
            className="grid h-11 w-11 place-items-center rounded-full bg-surface text-sm font-semibold text-ink shadow-soft ring-1 ring-line"
          >
            {pages}
          </Link>
        </>
      )}

      <Link
        href={buildHref(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full bg-surface text-ink shadow-soft ring-1 ring-line transition-all hover:ring-lavender-300",
          page === pages && "pointer-events-none opacity-40"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </Link>
    </nav>
  );
}
