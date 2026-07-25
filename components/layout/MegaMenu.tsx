"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { collections } from "../../lib/nav";
import { easeSoft } from "../../lib/motion";
import { PastelTile } from "../ui/PastelTile";

export function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.16 } }}
      transition={{ duration: 0.32, ease: easeSoft }}
      className="absolute left-1/2 top-full w-[min(64rem,calc(100vw-2.5rem))] -translate-x-1/2 pt-3"
    >
      <div className="overflow-hidden rounded-4xl bg-surface/95 p-6 shadow-lift glass-strong hairline">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr_0.9fr]">
          {collections.map((collection, index) => (
            <div key={collection.slug} className="space-y-3">
              <Link
                href={`/categories/${collection.slug}`}
                onClick={onNavigate}
                className="group/col flex items-center justify-between gap-2 rounded-2xl px-3 py-2 transition-colors hover:bg-lavender-50"
              >
                <span>
                  <span className="block font-display text-lg text-ink">{collection.label}</span>
                  <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-lavender-500">
                    {collection.tagline}
                  </span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-faint transition-transform duration-300 group-hover/col:translate-x-1 group-hover/col:text-lavender-600"
                  strokeWidth={2.2}
                />
              </Link>
              <p className="px-3 text-xs leading-relaxed text-muted">{collection.blurb}</p>
              <ul className="space-y-0.5">
                {collection.highlights.map((highlight) => (
                  <li key={highlight.href}>
                    <Link
                      href={highlight.href}
                      onClick={onNavigate}
                      className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-muted transition-colors hover:bg-blush-50 hover:text-ink"
                    >
                      <span aria-hidden className="h-1 w-1 rounded-full bg-blush-300" />
                      {highlight.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <span aria-hidden className="sr-only">
                {index}
              </span>
            </div>
          ))}

          <Link
            href="/products"
            onClick={onNavigate}
            className="group/promo relative flex min-h-56 flex-col justify-end overflow-hidden rounded-3xl p-5 text-ink shadow-soft"
          >
            <PastelTile
              seed="mega"
              glyph={false}
              className="transition-transform duration-700 group-hover/promo:scale-105"
            />
            <div className="relative space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-lavender-700">
                <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                This week
              </span>
              <p className="font-display text-xl leading-tight">The pastel drop is live</p>
              <p className="text-xs text-ink-700">Shop everything new →</p>
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
