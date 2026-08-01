"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import type { ColourPreset, Product } from "../../lib/types";
import {
  adjustStock,
  getColourPalette,
  updateVariants,
  type ColourInput,
  type VariantInput,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { FormCard } from "./FormField";
import { ImageUploader } from "./ImageUploader";
import { Swatch } from "../product/Swatch";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { cn, formatPrice } from "../../lib/utils";

interface ColourRow {
  id?: string;
  name: string;
  hex: string | null;
  /** The other half of a two-tone swatch, for a print or a stripe. */
  hex2: string | null;
  images: string[];
  isActive: boolean;
}

interface CellRow {
  id?: string;
  /** Null on a product sold in sizes only. */
  colourName: string | null;
  /** Empty on a product sold by colour alone. */
  label: string;
  /** Null means "whatever the product costs". Kept as typed, parsed on save. */
  price: string;
  isActive: boolean;
  /** Only shown, never edited here: stock moves through its own endpoint. */
  stock?: number;
}

/** What makes a cell its own cell, matched loosely so renaming a case is not a new row. */
function cellKey(colourName: string | null, label: string): string {
  return `${colourName?.trim().toLowerCase() ?? ""}::${label.trim().toLowerCase()}`;
}

/**
 * The matrix the current colours and sizes imply, carrying over what is already
 * known about each cell.
 *
 * Rebuilt rather than patched because adding one colour to three sizes adds three
 * cells, and working out which ones by hand is how a product ends up selling a
 * combination nobody set stock for. Anything the admin had already typed against
 * a surviving cell is kept, keyed on the pair rather than the row's position.
 */
function buildCells(colours: ColourRow[], sizes: string[], previous: CellRow[]): CellRow[] {
  if (colours.length === 0 && sizes.length === 0) return [];

  const known = new Map(previous.map((cell) => [cellKey(cell.colourName, cell.label), cell]));
  const colourNames: (string | null)[] = colours.length > 0 ? colours.map((c) => c.name) : [null];
  const labels = sizes.length > 0 ? sizes : [""];

  return colourNames.flatMap((colourName) =>
    labels.map((label) => {
      const existing = known.get(cellKey(colourName, label));
      // The names are refreshed from the lists even on a cell we already knew, so
      // fixing a typo in a colour renames its whole row rather than orphaning it.
      return existing
        ? { ...existing, colourName, label }
        : { colourName, label, price: "", isActive: true };
    })
  );
}

/** The cells and colours a saved product came back with, as rows to edit. */
function readProduct(product: Product): { colours: ColourRow[]; sizes: string[]; cells: CellRow[] } {
  const colours: ColourRow[] = (product.colours ?? []).map((colour) => ({
    id: colour.id,
    name: colour.name,
    hex: colour.hex,
    hex2: colour.hex2,
    images: colour.images,
    isActive: colour.isActive,
  }));

  const nameById = new Map(colours.map((colour) => [colour.id, colour.name]));

  const cells: CellRow[] = (product.variants ?? []).map((variant) => ({
    id: variant.id,
    colourName: variant.colourId ? (nameById.get(variant.colourId) ?? null) : null,
    label: variant.label,
    // Only an override is shown. A cell that simply costs what the product costs
    // has to look empty, or every save would freeze today's price onto it.
    price: variant.hasOwnPrice ? String(variant.price) : "",
    isActive: variant.isActive,
    stock: variant.stock,
  }));

  const sizes: string[] = [];
  for (const cell of cells) {
    if (cell.label && !sizes.some((size) => size.toLowerCase() === cell.label.toLowerCase())) {
      sizes.push(cell.label);
    }
  }

  return { colours, sizes, cells };
}

/**
 * Manages the colours and sizes a product comes in.
 *
 * Colours and sizes are edited as two short lists, and the buyable cells are
 * their cross product. Typing the matrix out by hand would be twelve rows for
 * three colours in four sizes, and the pair that got missed is the one a
 * customer picks.
 *
 * The whole set is sent at once, because "S, M, L in red and blue" is one
 * decision and half of it applied is a product selling combinations nobody chose.
 * Anything with orders or stock history behind it is switched off server-side
 * rather than deleted, so its ledger and the orders naming it survive.
 *
 * Stock is shown but not edited here: adding or taking away units goes through
 * the stock adjustment endpoint, which writes to the ledger.
 */
export function VariantManager({ product }: { product: Product }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const initial = readProduct(product);
  const [colours, setColours] = useState<ColourRow[]>(initial.colours);
  const [sizes, setSizes] = useState<string[]>(initial.sizes);
  const [cells, setCells] = useState<CellRow[]>(initial.cells);
  const [newSize, setNewSize] = useState("");

  /** Units waiting to be added, keyed by cell. Cleared once they land. */
  const [topUp, setTopUp] = useState<Record<string, string>>({});
  const [receiving, setReceiving] = useState<string | null>(null);

  /** The shop's palette, offered as one-click adds so names stop drifting. */
  const [palette, setPalette] = useState<ColourPreset[]>([]);

  useEffect(() => {
    if (!token) return;
    let live = true;

    getColourPalette(token)
      // A palette that will not load is not a reason to block editing colours:
      // typing one by hand still works, which is what happens with no palette.
      .then((data) => {
        if (live) setPalette(data.colours);
      })
      .catch(() => {});

    return () => {
      live = false;
    };
  }, [token]);

  /** Every change to either axis reshapes the matrix, so the two move together. */
  const applyAxes = (nextColours: ColourRow[], nextSizes: string[]) => {
    setColours(nextColours);
    setSizes(nextSizes);
    setCells((current) => buildCells(nextColours, nextSizes, current));
  };

  /**
   * Adds a colour from the shop's palette, or a blank one to name by hand.
   *
   * The palette is offered rather than enforced: a one-off colour still has to be
   * possible, and a shop that has not built a palette yet must not be blocked
   * from adding colours at all.
   */
  const addColour = (preset?: ColourPreset) => {
    const name = preset?.name ?? "New colour";
    const taken = colours.some((colour) => colour.name.trim().toLowerCase() === name.toLowerCase());

    applyAxes(
      [
        ...colours,
        {
          name: taken ? `${name} ${colours.length + 1}` : name,
          hex: preset?.hex ?? "#cccccc",
          hex2: preset?.hex2 ?? null,
          images: [],
          isActive: true,
        },
      ],
      sizes
    );
  };

  const updateColour = (index: number, patch: Partial<ColourRow>) => {
    const next = colours.map((colour, i) => (i === index ? { ...colour, ...patch } : colour));
    // Renaming a colour renames it across the matrix, so the axes are reapplied
    // rather than the colour list alone being replaced.
    if (patch.name !== undefined) applyAxes(next, sizes);
    else setColours(next);
  };

  const removeColour = (index: number) => {
    applyAxes(
      colours.filter((_, i) => i !== index),
      sizes
    );
  };

  const addSize = () => {
    const label = newSize.trim();
    if (!label) return;
    if (sizes.some((size) => size.toLowerCase() === label.toLowerCase())) {
      toast({ title: "Duplicate size", description: "Two sizes cannot have the same name.", tone: "error" });
      return;
    }
    applyAxes(colours, [...sizes, label]);
    setNewSize("");
  };

  const removeSize = (index: number) => {
    applyAxes(
      colours,
      sizes.filter((_, i) => i !== index)
    );
  };

  const updateCell = (index: number, patch: Partial<CellRow>) => {
    setCells(cells.map((cell, i) => (i === index ? { ...cell, ...patch } : cell)));
  };

  const cellName = (cell: CellRow) =>
    [cell.colourName, cell.label].filter(Boolean).join(" · ") || product.name;

  /**
   * Puts units on one shelf.
   *
   * Sent as a difference through the stock endpoint rather than written as a
   * total, because that endpoint records why the number moved. Two people
   * receiving a delivery at once both count, which is not true of a form that
   * posts where the count should end up.
   */
  const receive = async (index: number) => {
    const cell = cells[index];
    const delta = Number(topUp[cell.id ?? ""] ?? "");

    if (!token || !cell.id || !Number.isInteger(delta) || delta === 0) return;

    setReceiving(cell.id);
    try {
      const { product: updated } = await adjustStock(token, product.id, {
        delta,
        // A negative number here is somebody correcting a miscount, not a sale.
        reason: delta > 0 ? "RECEIVED" : "CORRECTION",
        variantId: cell.id,
      });

      /**
       * Reset from the whole response rather than patching the one row.
       *
       * The server is the only thing that knows what is on the shelf, and a row
       * patched locally can disagree with it silently — which is exactly the
       * complaint that a number looked updated until the page was reloaded. Same
       * path the save below uses, so both end up showing the same thing.
       */
      const next = readProduct(updated);
      setColours(next.colours);
      setSizes(next.sizes);
      setCells(next.cells);
      setTopUp({ ...topUp, [cell.id]: "" });

      const after = next.cells.find((row) => row.id === cell.id)?.stock ?? 0;

      toast({
        title: "Stock updated",
        description: `${cellName(cell)} now shows ${after}. Reload to confirm it stuck.`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Could not adjust the stock",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setReceiving(null);
    }
  };

  const handleSave = async () => {
    if (!token) return;

    const names = colours.map((colour) => colour.name.trim());
    if (names.some((name) => !name)) {
      toast({ title: "Empty colour", description: "Every colour needs a name.", tone: "error" });
      return;
    }
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
      toast({ title: "Duplicate colour", description: "Two colours cannot have the same name.", tone: "error" });
      return;
    }

    // Parsed before anything is sent, so a typo in one price does not save the
    // other nineteen cells and then fail.
    const priced = cells.map((cell) => ({ cell, price: cell.price.trim() }));
    const badPrice = priced.find(
      ({ price }) => price !== "" && !(Number(price) > 0)
    );
    if (badPrice) {
      toast({
        title: "Check that price",
        description: `"${badPrice.price}" is not an amount. Leave it blank to charge the product's own price.`,
        tone: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const colourPayload: ColourInput[] = colours.map((colour) => ({
        ...(colour.id ? { id: colour.id } : {}),
        name: colour.name.trim(),
        hex: colour.hex,
        hex2: colour.hex2,
        images: colour.images,
        isActive: colour.isActive,
      }));

      const variantPayload: VariantInput[] = priced.map(({ cell, price }) => ({
        ...(cell.id ? { id: cell.id } : {}),
        colourName: cell.colourName,
        label: cell.label,
        // Null rather than omitted, so clearing the box clears the override
        // instead of leaving yesterday's on the row.
        price: price === "" ? null : Number(price),
        isActive: cell.isActive,
      }));

      const { product: updated } = await updateVariants(token, product.id, {
        colours: colourPayload,
        variants: variantPayload,
      });

      const next = readProduct(updated);
      setColours(next.colours);
      setSizes(next.sizes);
      setCells(next.cells);

      toast({
        title: "Options saved",
        description: `${product.name} now sells in ${variantPayload.length} option${
          variantPayload.length === 1 ? "" : "s"
        }.`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Could not save options",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormCard
      title="Colours & sizes"
      description="Pick the colours and the sizes; every combination of the two becomes something to buy. The whole set is saved at once, and anything with orders behind it is switched off rather than deleted."
    >
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Colours</h3>

          {colours.length > 0 ? (
            <ul className="mt-3 space-y-4">
              {colours.map((colour, index) => (
                <li key={colour.id ?? `new-colour-${index}`} className="rounded-3xl bg-surface-soft p-4">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 rounded-full ring-1 ring-line-strong">
                      <Swatch hex={colour.hex} hex2={colour.hex2} className="h-9 w-9" />
                    </span>
                    <input
                      type="color"
                      // A colour with no hex still needs something in the picker,
                      // and grey is the least likely to be mistaken for a choice.
                      value={colour.hex ?? "#cccccc"}
                      onChange={(e) => updateColour(index, { hex: e.target.value })}
                      aria-label={`Swatch for ${colour.name}`}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-line-strong bg-white p-0.5"
                    />
                    <input
                      value={colour.name}
                      onChange={(e) => updateColour(index, { name: e.target.value })}
                      placeholder="Midnight blue"
                      className="min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateColour(index, { isActive: !colour.isActive })}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                        colour.isActive
                          ? "bg-mint-100 text-mint-600 hover:bg-mint-200"
                          : "bg-surface text-faint hover:bg-lavender-50"
                      )}
                    >
                      {colour.isActive ? "Active" : "Off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColour(index)}
                      aria-label={`Remove colour ${colour.name}`}
                      className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                    </button>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-lavender-600">
                      Photos for this colour ({colour.images.length})
                    </summary>
                    <div className="mt-3">
                      <ImageUploader
                        value={colour.images}
                        onChange={(images) => updateColour(index, { images })}
                      />
                      <p className="mt-2 text-xs text-muted">
                        Leave empty to show the product&rsquo;s own photos for this colour.
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              This product has no colours. Add one if it comes in more than one.
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => addColour()}>
              <Plus className="h-4 w-4" strokeWidth={2.3} />
              Add colour
            </Button>

            {/* One click from the shop's palette, which is what keeps "Navy" from
                also being typed as "navy blue" on the next product. */}
            {palette
              .filter(
                (preset) =>
                  !colours.some(
                    (colour) => colour.name.trim().toLowerCase() === preset.name.toLowerCase()
                  )
              )
              .map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => addColour(preset)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-lavender-50 py-1 pl-1 pr-3 text-xs font-bold text-lavender-700 transition-colors hover:bg-lavender-100"
                >
                  <span className="rounded-full ring-1 ring-line">
                    <Swatch hex={preset.hex} hex2={preset.hex2} className="h-5 w-5" />
                  </span>
                  {preset.name}
                </button>
              ))}
          </div>
        </section>

        <section className="border-t border-line pt-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Sizes</h3>

          {sizes.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {sizes.map((size, index) => (
                <li
                  key={size}
                  className="flex items-center gap-1.5 rounded-full bg-lavender-50 py-1 pl-3.5 pr-1.5 text-sm font-bold text-lavender-700"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    aria-label={`Remove size ${size}`}
                    className="grid h-6 w-6 place-items-center rounded-full text-lavender-500 transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              This product has no sizes. Add one if it comes in different sizes.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
              placeholder="S, M, L, XL..."
              className="min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addSize} disabled={!newSize.trim()}>
              <Plus className="h-4 w-4" strokeWidth={2.3} />
              Add
            </Button>
          </div>
        </section>

        {cells.length > 0 && (
          <section className="border-t border-line pt-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              What can be bought ({cells.length})
            </h3>
            <p className="mt-1 text-xs text-muted">
              Switch off a combination this product does not come in. Leave a price blank to charge the
              product&rsquo;s own {formatPrice(product.price)}.
            </p>

            {/* Labelled columns, because two bare number boxes side by side is
                how a price gets typed into the stock box and nothing happens. */}
            <div className="mt-4 hidden items-center gap-3 px-3.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-faint sm:flex">
              <span className="min-w-0 flex-1">Option</span>
              <span className="w-44 shrink-0">Stock</span>
              <span className="w-24 shrink-0">Price</span>
              <span className="w-16 shrink-0" />
            </div>

            <ul className="mt-2 space-y-2">
              {cells.map((cell, index) => (
                <li
                  key={cell.id ?? `new-cell-${cellKey(cell.colourName, cell.label)}`}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-soft px-3.5 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {cellName(cell)}
                  </span>

                  {cell.id ? (
                    <span className="flex w-44 shrink-0 items-center gap-2">
                      <span className="w-14 text-sm font-bold tabular-nums text-ink">
                        {cell.stock ?? 0}
                      </span>
                      <span className="relative flex-1">
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-mint-600"
                        >
                          +
                        </span>
                        <input
                          value={topUp[cell.id] ?? ""}
                          onChange={(e) => setTopUp({ ...topUp, [cell.id!]: e.target.value })}
                          onKeyDown={(e) => {
                            // Enter receives the units rather than submitting the
                            // page: this sits inside the product form.
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            void receive(index);
                          }}
                          inputMode="numeric"
                          placeholder="0"
                          aria-label={`Units to add to ${cellName(cell)}`}
                          className="w-full rounded-xl border border-line-strong bg-white py-1.5 pl-6 pr-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
                        />
                      </span>
                      <button
                        type="button"
                        onClick={() => void receive(index)}
                        disabled={receiving === cell.id || !Number(topUp[cell.id] ?? "")}
                        aria-label={`Add stock to ${cellName(cell)}`}
                        title="Put these units on the shelf"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-600 transition-colors hover:bg-mint-200 disabled:opacity-40"
                      >
                        <PackagePlus className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </button>
                    </span>
                  ) : (
                    // A cell that has never been saved has no id to stock against.
                    <span className="w-44 shrink-0 text-xs font-semibold text-faint">
                      Save first to stock this
                    </span>
                  )}

                  <span className="relative w-24 shrink-0">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-faint"
                    >
                      ₹
                    </span>
                    <input
                      value={cell.price}
                      onChange={(e) => updateCell(index, { price: e.target.value })}
                      inputMode="decimal"
                      placeholder={String(product.price)}
                      aria-label={`Price for ${cellName(cell)}`}
                      className="w-full rounded-xl border border-line-strong bg-white py-1.5 pl-6 pr-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
                    />
                  </span>

                  <button
                    type="button"
                    onClick={() => updateCell(index, { isActive: !cell.isActive })}
                    className={cn(
                      "w-16 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                      cell.isActive
                        ? "bg-mint-100 text-mint-600 hover:bg-mint-200"
                        : "bg-surface text-faint hover:bg-lavender-50"
                    )}
                  >
                    {cell.isActive ? "Active" : "Off"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          <Button type="button" onClick={handleSave} loading={saving} size="sm">
            {saving ? "Saving..." : "Save options"}
          </Button>
        </div>
      </div>
    </FormCard>
  );
}
