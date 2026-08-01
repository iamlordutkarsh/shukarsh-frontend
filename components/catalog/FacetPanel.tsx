"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Facet } from "../../lib/types";
import { cn } from "../../lib/utils";

/**
 * Reads the picked filters back out of the URL.
 *
 * The URL is the state. A shopper who narrows to cotton half-sleeves should be
 * able to send that link to somebody, and come back to it with the back button,
 * which is not true of anything held in a component.
 */
export function selectedFacets(params: URLSearchParams): Record<string, string[]> {
  const selected: Record<string, string[]> = {};

  for (const [key, value] of params.entries()) {
    const match = /^a\[([a-z0-9-]+)\]$/.exec(key);
    if (!match) continue;

    const values = value.split(",").map((entry) => entry.trim()).filter(Boolean);
    if (values.length > 0) selected[match[1]] = values;
  }

  return selected;
}

/**
 * The filters the catalogue is offering, and what is ticked.
 *
 * Every option is a link rather than a checkbox with a handler, so the whole
 * thing works before any JavaScript arrives and each state has a real address.
 * Counts come from the API with each question's own filter lifted, which is why
 * ticking one cotton does not show a zero beside every other fabric.
 */
export function FacetPanel({ facets }: { facets: Facet[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (facets.length === 0) return null;

  const selected = selectedFacets(searchParams);
  const activeCount = Object.values(selected).reduce((sum, values) => sum + values.length, 0);

  const hrefWith = (next: Record<string, string[]>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Cleared first, because a question narrowed down to nothing has to lose its
    // parameter rather than keep an empty one.
    for (const key of [...params.keys()]) {
      if (/^a\[[a-z0-9-]+\]$/.test(key)) params.delete(key);
    }

    for (const [key, values] of Object.entries(next)) {
      if (values.length > 0) params.set(`a[${key}]`, values.join(","));
    }

    // Narrowing changes how many pages there are, so page two of the old result
    // is not page two of the new one.
    params.delete("page");

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const toggleHref = (key: string, value: string) => {
    const current = selected[key] ?? [];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];

    return hrefWith({ ...selected, [key]: next });
  };

  return (
    <div className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <SlidersHorizontal className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
          Filter
        </h2>
        {activeCount > 0 && (
          <Link
            href={hrefWith({})}
            className="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700 transition-colors hover:bg-lavender-200"
          >
            Clear {activeCount}
            <X className="h-3 w-3" strokeWidth={2.8} />
          </Link>
        )}
      </div>

      <div className="mt-4 space-y-5">
        {facets.map((facet) => (
          <div key={facet.key}>
            <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint">
              {facet.label}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {facet.values.map((value) => (
                <li key={value.value}>
                  <Link
                    href={toggleHref(facet.key, value.value)}
                    scroll={false}
                    aria-pressed={value.selected}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      value.selected
                        ? "bg-ink text-white"
                        : "bg-lavender-50 text-lavender-700 hover:bg-lavender-100"
                    )}
                  >
                    {value.value}
                    <span className={cn("tabular-nums", value.selected ? "opacity-70" : "text-faint")}>
                      {value.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
