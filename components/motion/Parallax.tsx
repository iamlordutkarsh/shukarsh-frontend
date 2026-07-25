"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Pixels of travel across the full scroll of the element. Negative moves up. */
  distance?: number;
}

/** GPU-only transform parallax (no layout reads during scroll). */
export function Parallax({ children, className, distance = -70 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [-distance, distance]);
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.6 });

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}
