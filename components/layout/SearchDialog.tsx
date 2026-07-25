"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { getProducts } from "../../lib/api";
import { easeSoft } from "../../lib/motion";
import { collections } from "../../lib/nav";
import type { Product } from "../../lib/types";
import { useUI } from "../../lib/ui-store";
import { formatPrice } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { PastelTile } from "../ui/PastelTile";
import { Skeleton } from "../ui/Skeleton";

const suggestions = ["Press-on nails", "Pastel mug", "Knit top", "Storage jars", "Gift under ₹999"];

interface SearchState {
  term: string;
  items: Product[];
}

/** Rendered only while the dialog is open, so closing resets the query state. */
function SearchPanel({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchState | null>(null);

  const term = query.trim();
  const searching = term.length >= 2;
  const loading = searching && result?.term !== term;

  useEffect(() => {
    if (term.length < 2) return;
    let active = true;

    const timer = window.setTimeout(async () => {
      try {
        const data = await getProducts({ search: term, limit: 6 });
        if (active) setResult({ term, items: data.products });
      } catch {
        if (active) setResult({ term, items: [] });
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [term]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    onNavigate();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products");
  };

  const items = result?.items ?? [];

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
        className="flex items-center gap-3 border-b border-line px-6 py-5 pr-16"
      >
        <Search className="h-5 w-5 shrink-0 text-lavender-500" strokeWidth={2.4} />
        <input
          data-autofocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search for nails, mugs, knits..."
          aria-label="Search products"
          className="h-8 w-full border-0 bg-transparent p-0 text-base text-ink shadow-none outline-none placeholder:text-faint focus:ring-0"
        />
      </form>

      <div className="max-h-[26rem] overflow-y-auto overscroll-contain px-3 py-3">
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 p-2"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                    <Skeleton className="h-3 w-1/4 rounded-full" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : searching && items.length > 0 ? (
            <motion.ul
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: easeSoft }}
              className="space-y-1"
            >
              {items.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={onNavigate}
                    className="flex items-center gap-4 rounded-3xl p-2.5 transition-colors hover:bg-lavender-50"
                  >
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <PastelTile seed={product.slug} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                      <span className="block text-xs text-muted">{product.category.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink">{formatPrice(product.price)}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => submit(term)}
                  className="flex w-full items-center justify-between gap-2 rounded-3xl px-4 py-3 text-sm font-semibold text-lavender-700 transition-colors hover:bg-lavender-50"
                >
                  See all results for “{term}”
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </li>
            </motion.ul>
          ) : searching ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-5 py-10 text-center"
            >
              <p className="font-display text-lg text-ink">Nothing matched that</p>
              <p className="mt-1 text-sm text-muted">Try a shorter word, or browse everything.</p>
              <button
                type="button"
                onClick={() => submit("")}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender-600 hover:text-lavender-700"
              >
                Browse all products
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5 p-4"
            >
              <div>
                <p className="flex items-center gap-1.5 px-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
                  <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                  Popular searches
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => submit(item)}
                      className="rounded-full bg-lavender-50 px-3.5 py-2 text-sm font-medium text-lavender-700 transition-colors hover:bg-lavender-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="px-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Collections</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {collections.map((collection) => (
                    <Link
                      key={collection.slug}
                      href={`/categories/${collection.slug}`}
                      onClick={onNavigate}
                      className="group relative overflow-hidden rounded-3xl p-4 shadow-soft"
                    >
                      <PastelTile
                        seed={collection.slug}
                        glyph={false}
                        className="transition-transform duration-700 group-hover:scale-110"
                      />
                      <span className="relative block font-display text-base text-ink">{collection.label}</span>
                      <span className="relative block text-xs text-ink-700">{collection.tagline}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export function SearchDialog() {
  const { isOpen, close } = useUI();
  const open = isOpen("search");

  return (
    <Modal open={open} onClose={close} label="Search products" className="max-w-2xl rounded-4xl">
      <SearchPanel onNavigate={close} />
    </Modal>
  );
}
