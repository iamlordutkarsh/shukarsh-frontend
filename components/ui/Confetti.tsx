"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

const colors = ["#8b6bff", "#ff93b8", "#ffbb99", "#6fd8b8", "#c5aeff"];

/** Deterministic scatter so the burst stays pure and SSR-stable. */
function jitter(seed: number) {
  const value = Math.sin(seed * 127.1 + 11.7) * 43758.5453;
  return value - Math.floor(value);
}

/** One-shot celebration burst. Unmounts itself so nothing keeps animating. */
export function Confetti({ pieces = 48, duration = 2600 }: { pieces?: number; duration?: number }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  const confetti = useMemo(
    () =>
      Array.from({ length: pieces }).map((_, index) => ({
        id: index,
        left: jitter(index + 1) * 100,
        delay: jitter(index + 2) * 0.5,
        drift: (jitter(index + 3) - 0.5) * 160,
        rotate: (jitter(index + 4) - 0.5) * 720,
        size: 6 + jitter(index + 5) * 8,
        color: colors[index % colors.length],
        round: index % 2 === 0,
      })),
    [pieces]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), duration + 700);
    return () => window.clearTimeout(timer);
  }, [duration]);

  if (reduced || !visible) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[125] overflow-hidden">
      {confetti.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-[-8%]"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 1.6,
            backgroundColor: piece.color,
            borderRadius: piece.round ? "999px" : "3px",
          }}
          initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", x: piece.drift, opacity: [0, 1, 1, 0], rotate: piece.rotate }}
          transition={{ duration: duration / 1000, delay: piece.delay, ease: [0.2, 0.6, 0.5, 1] }}
        />
      ))}
    </div>
  );
}
