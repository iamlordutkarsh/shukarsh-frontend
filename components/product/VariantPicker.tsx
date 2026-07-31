"use client";

import { Check } from "lucide-react";
import type { Product } from "../../lib/types";
import { sellableColours, sellableSizes, variantFor } from "../../lib/variants";
import { cn } from "../../lib/utils";

/**
 * The colour and size a shopper picks, drawn as one control.
 *
 * A sold out option stays on show rather than disappearing. Someone who wears a
 * medium needs to see that mediums exist and are gone, not a row of sizes that
 * quietly never included theirs. A combination the shop never made is drawn
 * differently again, because "we do not sell a red XL" and "the red XLs went"
 * are two different disappointments.
 */
export function VariantPicker({
  product,
  colourId,
  label,
  onColour,
  onLabel,
  className,
}: {
  product: Product;
  colourId: string | null;
  label: string;
  onColour: (colourId: string) => void;
  onLabel: (label: string) => void;
  className?: string;
}) {
  const colours = sellableColours(product);
  const sizes = sellableSizes(product);

  if (colours.length === 0 && sizes.length === 0) return null;

  const chosenColour = colours.find((colour) => colour.id === colourId) ?? null;
  const chosen = colourId || colours.length === 0 ? variantFor(product, colourId, label) : null;

  return (
    <div className={cn("space-y-5", className)}>
      {colours.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Colour
            {chosenColour && <span className="ml-2 normal-case tracking-normal text-ink">{chosenColour.name}</span>}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-2.5" role="group" aria-label="Colour">
            {colours.map((colour) => {
              // Gone when nothing under this colour is left, whatever the size.
              const gone = sizes.length > 0
                ? sizes.every((size) => variantFor(product, colour.id, size).stock <= 0)
                : variantFor(product, colour.id, "").stock <= 0;
              const picked = colour.id === colourId;

              return (
                <button
                  key={colour.id}
                  type="button"
                  aria-pressed={picked}
                  aria-label={`${colour.name}${gone ? " (sold out)" : ""}`}
                  title={colour.name}
                  onClick={() => onColour(colour.id)}
                  className={cn(
                    "relative grid h-10 w-10 place-items-center rounded-full transition-all",
                    picked ? "ring-2 ring-ink ring-offset-2" : "ring-1 ring-line hover:ring-line-strong",
                    gone && "opacity-45"
                  )}
                >
                  <span
                    aria-hidden
                    className="h-full w-full rounded-full"
                    // The only place a shop-chosen colour can land: a hex is not
                    // expressible as a utility class, and there is no palette to
                    // map it onto. Null falls back to a neutral chip.
                    style={{ backgroundColor: colour.hex ?? "#e7e3f0" }}
                  />
                  {picked && (
                    <Check
                      className="absolute h-4 w-4 text-white mix-blend-difference"
                      strokeWidth={3}
                      aria-hidden
                    />
                  )}
                  {gone && (
                    <span
                      aria-hidden
                      className="absolute h-[1.5px] w-9 rotate-45 rounded-full bg-ink-900/70"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Size</p>

          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Size">
            {sizes.map((size) => {
              // Before a colour is picked, a size is shown as available if any
              // colour still has it: narrowing it down is the next choice, not
              // a reason to grey the row out before it has been made.
              const { exists, stock } = colourId
                ? variantFor(product, colourId, size)
                : colours.length > 0
                  ? colours.reduce(
                      (best, colour) => {
                        const cell = variantFor(product, colour.id, size);
                        return cell.stock > best.stock ? cell : { exists: best.exists || cell.exists, stock: best.stock };
                      },
                      { exists: false, stock: 0 }
                    )
                  : variantFor(product, null, size);

              const picked = size === label;
              const gone = !exists || stock <= 0;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={gone}
                  aria-pressed={picked}
                  aria-label={
                    exists ? `${size}${stock <= 0 ? " (sold out)" : ""}` : `${size} (not made in this colour)`
                  }
                  onClick={() => onLabel(size)}
                  className={cn(
                    "min-w-14 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                    picked
                      ? "bg-ink text-white shadow-soft"
                      : gone
                        ? "cursor-not-allowed bg-surface text-faint opacity-60"
                        : "bg-lavender-50 text-lavender-700 hover:bg-lavender-100",
                    // Struck through only when it is a real size that ran out. A
                    // combination that never existed is dimmed, not crossed off.
                    gone && exists && "line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {chosen && chosen.stock > 0 && chosen.stock <= 3 && (
        <p className="text-xs font-semibold text-peach-400">Only {chosen.stock} left in this option</p>
      )}
    </div>
  );
}

export default VariantPicker;
