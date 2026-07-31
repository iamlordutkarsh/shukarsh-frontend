"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { Category } from "../../lib/types";
import { cn } from "../../lib/utils";
import { inputClass } from "./FormField";

/** A category and every ancestor above it, root first. */
function pathTo(byId: Map<string, Category>, id: string | null): Category[] {
  const chain: Category[] = [];
  const seen = new Set<string>();
  let current = id ? byId.get(id) : undefined;

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return chain;
}

/**
 * Picks a category by walking down it, one column per level.
 *
 * A single select box is unusable past two levels: "Tshirts" tells you nothing
 * about which of four departments it sits in, and indenting names in a dropdown
 * only makes the list longer. Columns show the choice and the trail at once, and
 * the trail is what the shop actually thinks in.
 *
 * Only a leaf can be chosen. A product filed on a branch answers fewer questions
 * than one filed below it, and a catalogue where half the shirts sit on "Mens
 * Clothing" is one where nothing can be filtered.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string | null;
  onChange: (categoryId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const category of categories) {
      const key = category.parentId ?? null;
      map.set(key, [...(map.get(key) ?? []), category]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    }
    return map;
  }, [categories]);

  const isLeaf = (id: string) => (childrenOf.get(id) ?? []).length === 0;

  const chosenPath = pathTo(byId, value);
  /** Which branch is open, which is the chosen path until something else is clicked. */
  const [openPath, setOpenPath] = useState<string[]>(chosenPath.map((c) => c.id));

  // Each column is the children of the level opened before it, so the number of
  // columns follows the tree rather than being fixed.
  const columns: Category[][] = [childrenOf.get(null) ?? []];
  for (const id of openPath) {
    const children = childrenOf.get(id) ?? [];
    if (children.length > 0) columns.push(children);
  }

  const open = (depth: number, category: Category) => {
    setOpenPath([...openPath.slice(0, depth), category.id]);
    // Choosing happens on the leaf only, so clicking a branch merely opens it.
    if (isLeaf(category.id)) onChange(category.id);
  };

  const matches = search.trim()
    ? categories
        .filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase()))
        .filter((category) => isLeaf(category.id))
        .slice(0, 20)
    : null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search category..."
          aria-label="Search category"
          className={cn(inputClass, "pl-11")}
        />
      </div>

      {matches ? (
        <ul className="max-h-72 overflow-y-auto rounded-3xl bg-surface-soft p-2">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">Nothing matches that.</li>
          )}
          {matches.map((category) => {
            const trail = pathTo(byId, category.id);
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(category.id);
                    setOpenPath(trail.map((c) => c.id));
                    setSearch("");
                  }}
                  className="flex w-full flex-col items-start rounded-2xl px-3 py-2 text-left transition-colors hover:bg-lavender-50"
                >
                  <span className="text-sm font-semibold text-ink">{category.name}</span>
                  <span className="text-xs text-muted">
                    in {trail.slice(0, -1).map((c) => c.name).join(" / ") || "the top level"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex gap-2 overflow-x-auto rounded-3xl bg-surface-soft p-2">
          {columns.map((column, depth) => (
            <ul key={depth} className="max-h-72 min-w-52 shrink-0 overflow-y-auto">
              {column.map((category) => {
                const opened = openPath[depth] === category.id;
                const leaf = isLeaf(category.id);

                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => open(depth, category)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                        value === category.id
                          ? "bg-ink text-white"
                          : opened
                            ? "bg-lavender-100 text-lavender-700"
                            : "text-ink hover:bg-lavender-50"
                      )}
                    >
                      <span className="truncate">{category.name}</span>
                      {!leaf && <ChevronRight className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2.4} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        {chosenPath.length > 0 ? (
          <>
            Filed under <span className="font-semibold text-ink">{chosenPath.map((c) => c.name).join(" / ")}</span>
          </>
        ) : (
          "Pick the most specific category that fits. It decides which details this product is asked for."
        )}
      </p>
    </div>
  );
}
