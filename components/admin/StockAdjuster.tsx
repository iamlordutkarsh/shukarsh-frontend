"use client";

import { useEffect, useId, useState } from "react";
import { History, Minus, Plus } from "lucide-react";
import { adjustStock, getStockMoves } from "../../lib/api";
import { defaultReasonFor, manualReasons, reorderLevel, stockReasonLabel } from "../../lib/inventory";
import type { ManualStockReason, Product, StockMove } from "../../lib/types";
import { variantName } from "../../lib/variants";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { inputClass, labelClass } from "./FormField";

function movedAt(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Adjust stock by a difference and see where it went.
 *
 * The number is never typed as a total. A form posting "now there are 12" throws
 * away whatever happened between loading the page and saving it, which on a
 * catalogue that is also selling means a sale silently reappearing on the shelf.
 */
export function StockAdjuster({
  product,
  token,
  open,
  onClose,
  onSaved,
}: {
  product: Product;
  token: string;
  open: boolean;
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const uid = useId();
  const { toast } = useToast();

  const [amount, setAmount] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [reason, setReason] = useState<ManualStockReason>("RECEIVED");
  const [touchedReason, setTouchedReason] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [moves, setMoves] = useState<StockMove[] | null>(null);

  /**
   * Which shelf is being counted. Once a product has options the total is only
   * their sum, so an adjustment that does not name one has nowhere to land and
   * the API refuses it. One option is not a choice, so it is made for them.
   */
  const cells = (product.variants ?? []).filter((variant) => variant.isActive);
  const [variantId, setVariantId] = useState<string | null>(
    cells.length === 1 ? cells[0].id : null
  );

  const cellName = (variant: Product["variants"][number]) =>
    variantName(
      (product.colours ?? []).find((colour) => colour.id === variant.colourId)?.name ?? null,
      variant.label
    ) ?? product.name;

  const chosen = cells.find((cell) => cell.id === variantId) ?? null;
  const needsCell = cells.length > 0 && !chosen;

  const delta = amount * direction;

  // Nothing is reset here: the products list mounts this fresh for whichever
  // product is being adjusted, so the initial state above is already a clean form.
  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await getStockMoves(token, product.id);
        if (active) setMoves(data.moves);
      } catch {
        // A history that will not load must not block the adjustment itself.
        if (active) setMoves([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [product.id, token]);

  // Adding stock is nearly always a delivery, taking it away nearly always
  // breakage, so the reason follows the direction until someone picks their own.
  const flip = (next: 1 | -1) => {
    setDirection(next);
    if (!touchedReason) setReason(defaultReasonFor(next));
  };

  const save = async () => {
    if (amount < 1 || needsCell) return;

    setSaving(true);
    try {
      const { product: updated } = await adjustStock(token, product.id, {
        delta,
        reason,
        note: note.trim() || undefined,
        ...(variantId ? { variantId } : {}),
      });

      const after = variantId
        ? (updated.variants ?? []).find((variant) => variant.id === variantId)?.stock
        : updated.stock;

      onSaved(updated);
      toast({
        title: "Stock updated",
        description: `${chosen ? cellName(chosen) : product.name} now shows ${after ?? updated.stock}.`,
        tone: "success",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Could not adjust the stock",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={`Adjust stock for ${product.name}`} className="max-w-xl">
      <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
        <h2 className="pr-12 font-display text-xl text-ink">{product.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {product.stock} on the shelf · reorder at {reorderLevel(product)}
        </p>

        <div className="mt-6 space-y-5">
          {cells.length > 0 && (
            <div className="space-y-2">
              <span className={labelClass}>Which one</span>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Which option">
                {cells.map((cell) => (
                  <button
                    key={cell.id}
                    type="button"
                    aria-pressed={cell.id === variantId}
                    onClick={() => setVariantId(cell.id)}
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm font-bold transition-colors",
                      cell.id === variantId
                        ? "bg-ink text-white shadow-soft"
                        : "bg-lavender-50 text-lavender-700 hover:bg-lavender-100"
                    )}
                  >
                    {cellName(cell)}
                    <span className="ml-1.5 text-xs font-semibold opacity-70">{cell.stock}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className={labelClass}>What changed</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex overflow-hidden rounded-2xl ring-1 ring-line">
                <button
                  type="button"
                  onClick={() => flip(1)}
                  aria-pressed={direction === 1}
                  className={cn(
                    "flex h-12 items-center gap-1.5 px-4 text-sm font-semibold transition-colors",
                    direction === 1 ? "bg-mint-100 text-mint-500" : "text-muted hover:bg-lavender-50/60"
                  )}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.6} />
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => flip(-1)}
                  aria-pressed={direction === -1}
                  className={cn(
                    "flex h-12 items-center gap-1.5 px-4 text-sm font-semibold transition-colors",
                    direction === -1 ? "bg-rose-50 text-rose-500" : "text-muted hover:bg-lavender-50/60"
                  )}
                >
                  <Minus className="h-4 w-4" strokeWidth={2.6} />
                  Take away
                </button>
              </div>

              <input
                id={`${uid}-amount`}
                type="number"
                min={1}
                max={10000}
                value={amount}
                onChange={(event) => setAmount(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
                aria-label="How many units"
                className={cn(inputClass, "w-24")}
              />

              <p className="text-sm text-muted">
                {product.stock} → <span className="font-semibold text-ink">{product.stock + delta}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor={`${uid}-reason`} className={labelClass}>
              Why
            </label>
            <select
              id={`${uid}-reason`}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value as ManualStockReason);
                setTouchedReason(true);
              }}
              className={inputClass}
            >
              {manualReasons.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.hint}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor={`${uid}-note`} className={labelClass}>
              Note <span className="font-normal normal-case tracking-normal text-faint">(optional)</span>
            </label>
            <input
              id={`${uid}-note`}
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={200}
              placeholder="Invoice 4412, two boxes"
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="dark" onClick={save} loading={saving} disabled={amount < 1 || needsCell}>
              {direction === 1 ? `Add ${amount}` : `Take away ${amount}`}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-7 border-t border-line pt-5">
          <h3 className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
            <History className="h-3.5 w-3.5" strokeWidth={2.4} />
            Where the stock went
          </h3>

          {moves === null ? (
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full rounded-2xl" />
              ))}
            </div>
          ) : moves.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing recorded yet. Every movement from here on shows up in this list.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {moves.map((move) => (
                <li
                  key={move.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-2xl bg-lavender-50/60 px-3 py-2 text-sm"
                >
                  <span
                    className={cn(
                      "w-10 shrink-0 font-mono font-semibold",
                      move.delta > 0 ? "text-mint-500" : "text-rose-500"
                    )}
                  >
                    {move.delta > 0 ? `+${move.delta}` : move.delta}
                  </span>
                  <span className="font-semibold text-ink">{stockReasonLabel[move.reason]}</span>
                  <span className="text-muted">left {move.balance}</span>
                  <span className="ml-auto text-xs text-faint">{movedAt(move.createdAt)}</span>
                  {(move.note || move.by) && (
                    <span className="w-full text-xs text-muted">
                      {[move.note, move.by].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
