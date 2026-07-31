"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ProductSpec } from "../../lib/types";
import { Button } from "../ui/Button";
import { inputClass } from "./FormField";
import { cn } from "../../lib/utils";

/** Common enough to be worth one click, short enough not to be a taxonomy. */
const SUGGESTIONS = ["Material", "Care", "Origin", "Warranty", "Finish", "Capacity", "Included"];

function move(specs: ProductSpec[], from: number, to: number): ProductSpec[] {
  if (to < 0 || to >= specs.length) return specs;
  const next = [...specs];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

/**
 * The spec table shown under a product.
 *
 * Free-form pairs rather than fixed columns, because a saucepan and a hair clip
 * have nothing in common worth naming in a schema, and a fixed set would be
 * mostly blank on everything. Order is the shop's, since the first two rows are
 * the ones anybody reads.
 *
 * Blank rows are allowed while typing and dropped on save by the API, so a half
 * finished row never blocks the form.
 */
export function SpecEditor({
  value,
  onChange,
}: {
  value: ProductSpec[];
  onChange: (specs: ProductSpec[]) => void;
}) {
  const update = (index: number, patch: Partial<ProductSpec>) => {
    onChange(value.map((spec, i) => (i === index ? { ...spec, ...patch } : spec)));
  };

  const unused = SUGGESTIONS.filter(
    (label) => !value.some((spec) => spec.label.trim().toLowerCase() === label.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((spec, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <input
                value={spec.label}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="Material"
                aria-label={`Spec ${index + 1} name`}
                className={cn(inputClass, "h-11 w-full sm:w-44")}
              />
              <input
                value={spec.value}
                onChange={(e) => update(index, { value: e.target.value })}
                placeholder="Stainless steel"
                aria-label={`Spec ${index + 1} value`}
                className={cn(inputClass, "h-11 min-w-0 flex-1")}
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onChange(move(value, index, index - 1))}
                  disabled={index === 0}
                  aria-label={`Move ${spec.label || "row"} up`}
                  className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-lavender-600 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(move(value, index, index + 1))}
                  disabled={index === value.length - 1}
                  aria-label={`Move ${spec.label || "row"} down`}
                  className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-lavender-600 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  aria-label={`Remove ${spec.label || "row"}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Nothing here yet. The product page shows its own dimensions and weight regardless; this is for
          what only you know.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange([...value, { label: "", value: "" }])}
        >
          <Plus className="h-4 w-4" strokeWidth={2.3} />
          Add row
        </Button>

        {unused.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange([...value, { label, value: "" }])}
            className="rounded-full bg-lavender-50 px-3 py-1.5 text-xs font-bold text-lavender-700 transition-colors hover:bg-lavender-100"
          >
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}
