"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { easeSoft } from "../../lib/motion";
import { cn } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";

export function ProductGallery({
  images,
  name,
  seed,
  badge,
}: {
  images: string[];
  name: string;
  seed: string;
  badge?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const current = images[active];

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="space-y-4">
      <div
        onPointerMove={handleMove}
        onPointerLeave={() => setZoom(null)}
        className="group relative aspect-square overflow-hidden rounded-5xl bg-lavender-50 shadow-soft"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current ?? "fallback"}
            initial={reduced ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: easeSoft }}
            className="absolute inset-0"
          >
            {current ? (
              <Image
                src={current}
                alt={name}
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover transition-transform duration-300 ease-out"
                style={
                  zoom
                    ? { transform: "scale(1.7)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : { transform: "scale(1)" }
                }
              />
            ) : (
              <PastelTile seed={seed} />
            )}
          </motion.div>
        </AnimatePresence>

        {badge && <div className="absolute left-5 top-5 z-10 flex flex-col gap-2">{badge}</div>}

        {current && (
          <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-surface/85 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Hover to zoom
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-lavender-50 shadow-soft transition-all duration-300",
                index === active ? "ring-2 ring-lavender-500 ring-offset-2" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
