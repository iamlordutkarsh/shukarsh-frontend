"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Category } from "../../lib/types";
import { cn } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";

export function CategoryCard({
  category,
  className,
  priority = false,
}: {
  category: Category;
  className?: string;
  priority?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn("group relative h-full", className)}
    >
      <Link
        href={`/categories/${category.slug}`}
        className="relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-5xl shadow-soft transition-shadow duration-500 group-hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-500"
      >
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 92vw"
            className="object-cover transition-transform duration-[1100ms] ease-[var(--ease-soft)] group-hover:scale-[1.09]"
          />
        ) : (
          <PastelTile
            seed={category.slug}
            className="transition-transform duration-[1100ms] ease-[var(--ease-soft)] group-hover:scale-[1.09]"
          />
        )}

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-lavender-500/10"
        />

        <div className="relative z-10 flex items-end justify-between gap-4 p-6">
          <div className="min-w-0">
            <h3 className="font-display text-2xl text-white drop-shadow-sm">{category.name}</h3>
            {category.description && (
              <p className="mt-1 line-clamp-2 max-w-xs text-sm leading-relaxed text-white/80">
                {category.description}
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-white/90">
              Shop now
              <span
                aria-hidden
                className="h-px w-6 bg-white/70 transition-all duration-500 group-hover:w-10 group-hover:bg-blush-200"
              />
            </span>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/90 text-ink shadow-soft transition-all duration-500 group-hover:rotate-45 group-hover:bg-white">
            <ArrowUpRight className="h-5 w-5" strokeWidth={2.2} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default CategoryCard;
