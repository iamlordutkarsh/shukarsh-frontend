"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, X } from "lucide-react";
import type { Category } from "../../lib/types";
import { cn } from "../../lib/utils";

const sortLabels: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

export function FilterBar({
  categories,
  activeCategoryId,
  activeSort,
  search,
  total,
}: {
  categories: Category[];
  activeCategoryId?: string;
  activeSort: string;
  search?: string;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    // Chips and sort share a row, so the sort is anchored to something. On its
    // own line it sat a thousand pixels from the only thing beside it and read
    // as a control that had come loose.
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Full width on a phone, so the chips are not squeezed into a strip
            narrower than two of them; the sort wraps underneath instead. */}
        <div className="no-scrollbar -mx-1 flex w-full min-w-0 items-center gap-2 overflow-x-auto px-1 py-1 sm:w-auto sm:flex-1">
          <Link
            href={buildHref({ categoryId: undefined })}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
              !activeCategoryId
                ? "bg-ink-900 text-white shadow-soft"
                : "bg-surface/80 text-ink-700 shadow-soft ring-1 ring-line hover:ring-lavender-300"
            )}
          >
            Everything
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={buildHref({ categoryId: category.id })}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
                activeCategoryId === category.id
                  ? "bg-ink-900 text-white shadow-soft"
                  : "bg-surface/80 text-ink-700 shadow-soft ring-1 ring-line hover:ring-lavender-300"
              )}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <label className="relative inline-flex shrink-0 items-center">
          <span className="sr-only">Sort products</span>
          <ArrowUpDown
            aria-hidden
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-lavender-500"
            strokeWidth={2.4}
          />
          <select
            value={activeSort}
            onChange={(event) => router.push(buildHref({ sort: event.target.value }))}
            className="h-10 w-48 appearance-none rounded-full border-0 bg-surface pl-10 pr-4 text-sm font-medium text-ink shadow-soft ring-1 ring-line focus:ring-2 focus:ring-lavender-400"
          >
            {sortLabels.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          {total} {total === 1 ? "piece" : "pieces"}
        </span>
        {search && (
          <Link
            href={buildHref({ search: undefined })}
            className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700 transition-colors hover:bg-lavender-200"
          >
            “{search}”
            <X className="h-3 w-3" strokeWidth={2.8} />
          </Link>
        )}
      </div>
    </div>
  );
}
