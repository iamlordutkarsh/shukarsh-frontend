"use client";

import type { ProductVariant } from "../../lib/types";

/**
 * A sold out size stays on show rather than disappearing.
 *
 * Someone who wears a medium needs to see that mediums exist and are gone, not
 * a row of sizes that quietly never included theirs.
 */
export function SizePicker({
  sizes,
  value,
  onChange,
  className,
}: {
  sizes: ProductVariant[];
  value: string | null;
  onChange: (variantId: string) => void;
  className?: string;
}) {
  if (sizes.length === 0) return null;

  const chosenSize = sizes.find((size) => size.id === value);

  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Size</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Size">
        {sizes.map((size) => {
          const gone = size.stock <= 0;
          const chosen = size.id === value;

          return (
            <button
              key={size.id}
              type="button"
              disabled={gone}
              aria-pressed={chosen}
              onClick={() => onChange(size.id)}
              className={`min-w-14 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                chosen
                  ? "bg-ink text-white shadow-soft"
                  : gone
                    ? "cursor-not-allowed bg-surface text-faint line-through opacity-60"
                    : "bg-lavender-50 text-lavender-700 hover:bg-lavender-100"
              }`}
            >
              {size.label}
            </button>
          );
        })}
      </div>

      {chosenSize && chosenSize.stock > 0 && chosenSize.stock <= 3 ? (
        <p className="mt-2 text-xs font-semibold text-peach-400">
          Only {chosenSize.stock} left in this size
        </p>
      ) : null}
    </div>
  );
}

export default SizePicker;
