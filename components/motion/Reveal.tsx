"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { fadeIn, fadeUp, revealViewport, scaleIn, slideLeft, staggerParent } from "../../lib/motion";
import { cn } from "../../lib/utils";

type RevealVariant = "up" | "in" | "scale" | "left";

const variantMap: Record<RevealVariant, Variants> = {
  up: fadeUp,
  in: fadeIn,
  scale: scaleIn,
  left: slideLeft,
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
}

/** Scroll-triggered entrance. Renders static markup when motion is reduced. */
export function Reveal({ children, className, variant = "up", delay = 0 }: RevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={variantMap[variant]}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

/** Parent that staggers any <RevealItem> descendants once scrolled into view. */
export function RevealGroup({ children, className, stagger = 0.08, delay = 0 }: RevealGroupProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={staggerParent(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      {children}
    </motion.div>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}

export function RevealItem({ children, className, variant = "up" }: RevealItemProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={cn(className)} variants={variantMap[variant]}>
      {children}
    </motion.div>
  );
}
