"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getColourPalette, type ColourInput } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { ColourPreset } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Swatch } from "../product/Swatch";
import { Button } from "../ui/Button";
import { inputClass } from "./FormField";

/**
 * Picks the colours and sizes a product comes in, while it is being created.
 *
 * The full matrix editor cannot be used here, because it saves against a product
 * that does not exist yet. This is the smaller half of it: name the two axes now,
 * and the cross product of them becomes what can be bought. Stock, per-cell
 * prices and per-colour photos stay on the edit screen, where there is a product
 * to hang them on.
 *
 * Either axis alone is fine. Colours only, sizes only, both, or neither are all
 * ordinary products, and the matrix is built from whichever were given.
 */
export function OptionsChooser({
  colours,
  sizes,
  onColours,
  onSizes,
}: {
  colours: ColourInput[];
  sizes: string[];
  onColours: (colours: ColourInput[]) => void;
  onSizes: (sizes: string[]) => void;
}) {
  const [newSize, setNewSize] = useState("");
  const { token } = useAuth();
  const [palette, setPalette] = useState<ColourPreset[]>([]);

  useEffect(() => {
    if (!token) return;
    let live = true;

    getColourPalette(token)
      .then((data) => {
        if (live) setPalette(data.colours);
      })
      // No palette is not a problem: typing a colour by hand still works, which
      // is exactly what a shop that has not built one yet does.
      .catch(() => {});

    return () => {
      live = false;
    };
  }, [token]);

  const add = (preset?: ColourPreset) => {
    const name = preset?.name ?? "";
    if (name && colours.some((colour) => colour.name.toLowerCase() === name.toLowerCase())) return;

    onColours([
      ...colours,
      { name, hex: preset?.hex ?? "#cccccc", hex2: preset?.hex2 ?? null, images: [], isActive: true },
    ]);
  };

  const update = (index: number, patch: Partial<ColourInput>) => {
    onColours(colours.map((colour, i) => (i === index ? { ...colour, ...patch } : colour)));
  };

  const addSize = () => {
    const size = newSize.trim();
    if (!size) return;
    if (sizes.some((existing) => existing.toLowerCase() === size.toLowerCase())) return;
    onSizes([...sizes, size]);
    setNewSize("");
  };

  /** What the two axes multiply out to, which is what will actually be created. */
  const cells = Math.max(colours.length, 1) * Math.max(sizes.length, 1) -
    (colours.length === 0 && sizes.length === 0 ? 1 : 0);

  const unused = palette.filter(
    (preset) => !colours.some((colour) => colour.name.toLowerCase() === preset.name.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Colours</h3>

      {colours.length > 0 && (
        <ul className="space-y-2">
          {colours.map((colour, index) => (
            <li key={index} className="flex items-center gap-3">
              <span className="shrink-0 rounded-full ring-1 ring-line-strong">
                <Swatch hex={colour.hex} hex2={colour.hex2} className="h-9 w-9" />
              </span>

              <input
                value={colour.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="Midnight blue"
                aria-label={`Colour ${index + 1} name`}
                className={cn(inputClass, "h-11 min-w-0 flex-1")}
              />

              <input
                type="color"
                value={colour.hex ?? "#cccccc"}
                onChange={(event) => update(index, { hex: event.target.value })}
                aria-label={`Swatch for ${colour.name || `colour ${index + 1}`}`}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-line-strong bg-white p-0.5"
              />

              <button
                type="button"
                onClick={() => onColours(colours.filter((_, i) => i !== index))}
                aria-label={`Remove ${colour.name || `colour ${index + 1}`}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => add()}>
          <Plus className="h-4 w-4" strokeWidth={2.3} />
          Add colour
        </Button>

        {unused.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => add(preset)}
            className="inline-flex items-center gap-1.5 rounded-full bg-lavender-50 py-1 pl-1 pr-3 text-xs font-bold text-lavender-700 transition-colors hover:bg-lavender-100"
          >
            <span className="rounded-full ring-1 ring-line">
              <Swatch hex={preset.hex} hex2={preset.hex2} className="h-5 w-5" />
            </span>
            {preset.name}
          </button>
        ))}
      </div>

      <div className="border-t border-line pt-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Sizes</h3>

        {sizes.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {sizes.map((size, index) => (
              <li
                key={size}
                className="flex items-center gap-1.5 rounded-full bg-lavender-50 py-1 pl-3.5 pr-1.5 text-sm font-bold text-lavender-700"
              >
                {size}
                <button
                  type="button"
                  onClick={() => onSizes(sizes.filter((_, i) => i !== index))}
                  aria-label={`Remove size ${size}`}
                  className="grid h-6 w-6 place-items-center rounded-full text-lavender-500 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2.4} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          <input
            value={newSize}
            onChange={(event) => setNewSize(event.target.value)}
            onKeyDown={(event) => {
              // Enter adds the size rather than submitting the product: somebody
              // typing S, M, L in a row must not create the product on the first.
              if (event.key !== "Enter") return;
              event.preventDefault();
              addSize();
            }}
            placeholder="S, M, L, XL..."
            aria-label="New size"
            className={cn(inputClass, "h-11 min-w-0 flex-1")}
          />
          <Button type="button" variant="secondary" size="sm" onClick={addSize} disabled={!newSize.trim()}>
            <Plus className="h-4 w-4" strokeWidth={2.3} />
            Add
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        {cells > 0
          ? `${cells} thing${cells === 1 ? "" : "s"} to buy. You will land on this product afterwards to count stock in.`
          : "Leave both empty for a product that sells as one thing. You can add options later."}
      </p>
    </div>
  );
}
