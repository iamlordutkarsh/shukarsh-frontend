"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { easeSoft } from "../../lib/motion";

/**
 * Entrance animation keyed on pathname. Deliberately has no exit variant: the
 * App Router mounts the next route before the previous one unmounts, so exit
 * animations there cause overlap and layout jank.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeSoft }}
    >
      {children}
    </motion.div>
  );
}
