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
 * Picks the colours a product comes in, while it is being created.
 *
 * The full matrix editor cannot be used here, because it saves against a product
 * that does not exist yet. This is the smaller half of it: name the colours now,
 * and stock them once the product is real. Sizes, per-cell prices and per-colour
 * photos all stay on the edit screen, where there is a product to hang them on.
 *
 * Every colour picked becomes one buyable option. A shop that also sells sizes
 * adds them afterwards and the matrix fills itself out.
 */
export function ColourChooser({
  value,
  onChange,
}: {
  value: ColourInput[];
  onChange: (colours: ColourInput[]) => void;
}) {
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
    if (name && value.some((colour) => colour.name.toLowerCase() === name.toLowerCase())) return;

    onChange([
      ...value,
      { name, hex: preset?.hex ?? "#cccccc", hex2: preset?.hex2 ?? null, images: [], isActive: true },
    ]);
  };

  const update = (index: number, patch: Partial<ColourInput>) => {
    onChange(value.map((colour, i) => (i === index ? { ...colour, ...patch } : colour)));
  };

  const unused = palette.filter(
    (preset) => !value.some((colour) => colour.name.toLowerCase() === preset.name.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((colour, index) => (
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
                onClick={() => onChange(value.filter((_, i) => i !== index))}
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

      <p className="text-xs text-muted">
        {value.length > 0
          ? "Each colour becomes something to buy. You will be taken to this product afterwards to count stock in and add sizes."
          : "Leave empty for a product that comes in one colour only. You can add colours later."}
      </p>
    </div>
  );
}
