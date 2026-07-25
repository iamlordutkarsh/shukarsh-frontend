import type { Transition, Variants } from "motion/react";

/** Shared easing curves. Mirrors --ease-soft / --ease-bouncy in globals.css. */
export const easeSoft = [0.22, 1, 0.36, 1] as const;
export const easeBouncy = [0.34, 1.56, 0.64, 1] as const;

export const springSoft: Transition = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 };
export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 30 };
export const springBouncy: Transition = { type: "spring", stiffness: 520, damping: 18 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: easeSoft },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: easeSoft } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: easeSoft } },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 36 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: easeSoft } },
};

export function staggerParent(stagger = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
}

/** Viewport config shared by every scroll-triggered reveal. */
export const revealViewport = { once: true, margin: "-12% 0px -8% 0px" } as const;
