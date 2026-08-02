"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MousePointerClick, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { collections } from "../../lib/nav";
import { fadeUp, staggerParent } from "../../lib/motion";
import { FloatingDecor } from "../motion/FloatingDecor";
import { Parallax } from "../motion/Parallax";
import { ButtonLink } from "../ui/Button";
import { PastelTile } from "../ui/PastelTile";

const trust = [
  { icon: Truck, label: "Tracked delivery" },
  { icon: ShieldCheck, label: "Secure Razorpay checkout" },
  { icon: PackageCheck, label: "Handpicked, small batch" },
];

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-10 pt-10 sm:pt-16">
      <FloatingDecor />

      <div className="section-shell relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div variants={staggerParent(0.09, 0.05)} initial="hidden" animate="show" className="space-y-7">
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-lavender-700 shadow-soft hairline"
          >
            <Sparkles className="h-3.5 w-3.5 text-blush-400" strokeWidth={2.6} />
            New pastel drop is live
          </motion.span>

          <motion.h1 variants={fadeUp} className="text-display text-balance">
            Little things that make
            <br className="hidden sm:block" /> life feel <span className="text-gradient animate-pan">softer</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Kitchen finds, everyday clothing and salon-grade press-on nails, all chosen in pastel and made to be
            used, worn and loved.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/products" size="lg">
              Shop everything
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </ButtonLink>
            <ButtonLink href="/categories/artificial-nails" variant="secondary" size="lg">
              The nail edit
            </ButtonLink>
          </motion.div>

          <motion.ul variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-2.5 pt-2">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted">
                <Icon className="h-4 w-4 text-lavender-500" strokeWidth={2.3} />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {/* The whole collage is above the fold and one of these is the LCP
                element, so none of it waits on the lazy observer. */}
            <Parallax distance={-18} className="col-span-1">
              <CollectionTile index={0} priority className="min-h-64 sm:min-h-[28rem]" />
            </Parallax>
            <div className="space-y-4 sm:space-y-5">
              <Parallax distance={14}>
                <CollectionTile index={1} priority className="min-h-36 sm:min-h-[13.5rem]" />
              </Parallax>
              <Parallax distance={26}>
                <CollectionTile index={2} priority className="min-h-36 sm:min-h-[13.5rem]" />
              </Parallax>
            </div>
          </div>

          {/* Parked over the lead tile's empty top-left corner: the only spot in
              the collage with no photo subject and no label to collide with. */}
          <motion.div
            aria-hidden
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute -left-7 top-4 hidden h-24 w-24 place-items-center rounded-full bg-surface/90 shadow-soft backdrop-blur-sm sm:grid"
          >
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <path id="hero-badge" d="M50 50m-34 0a34 34 0 1 1 68 0a34 34 0 1 1-68 0" />
              </defs>
              <text className="fill-lavender-600 text-[0.72rem] font-bold uppercase tracking-[0.22em]">
                <textPath href="#hero-badge">shukarsh · soft goods ·</textPath>
              </text>
            </svg>
          </motion.div>
        </div>
      </div>

      <div className="section-shell relative mt-14 hidden justify-center sm:flex">
        <motion.span
          aria-hidden
          animate={reduced ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-faint"
        >
          <MousePointerClick className="h-3.5 w-3.5" strokeWidth={2.4} />
          Scroll to explore
        </motion.span>
      </div>
    </section>
  );
}

function CollectionTile({
  index,
  className,
  priority = false,
}: {
  index: number;
  className?: string;
  priority?: boolean;
}) {
  const collection = collections[index];
  if (!collection) return null;

  return (
    <Link
      href={`/categories/${collection.slug}`}
      className={`group relative flex flex-col justify-end overflow-hidden rounded-5xl p-5 shadow-soft transition-shadow duration-500 hover:shadow-lift ${className ?? ""}`}
    >
      {collection.image ? (
        <Image
          src={collection.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 32vw, 46vw"
          className={`object-cover ${collection.imageFocus} transition-transform duration-[900ms] ease-[var(--ease-soft)] group-hover:scale-110`}
        />
      ) : (
        <PastelTile seed={collection.slug} className="transition-transform duration-[900ms] group-hover:scale-110" />
      )}

      {/* Light scrim rather than the usual dark one: the art is near-white, so
          ink text on a frosted wash keeps contrast without muddying the pastel. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-white/95 via-white/60 to-transparent"
      />

      <span className="relative">
        <span className="block text-[0.625rem] font-bold uppercase tracking-[0.2em] text-ink-700/80">
          {collection.tagline}
        </span>
        <span className="mt-1 flex items-center gap-1.5 font-display text-xl text-ink">
          {collection.label}
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={2.4}
          />
        </span>
      </span>
    </Link>
  );
}
