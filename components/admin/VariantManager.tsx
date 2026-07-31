"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Product } from "../../lib/types";
import { updateVariants, type VariantInput } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { FormCard } from "./FormField";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { cn } from "../../lib/utils";

interface VariantRow extends VariantInput {
  /** Only shown, never edited here: stock moves through its own endpoint. */
  stock?: number;
  /** A size that was removed from the list but still has history is switched
   * off server-side, not deleted. Showing it lets the admin bring it back. */
  inactive?: boolean;
}

/**
 * Manages the set of sizes a product comes in.
 *
 * The whole list is sent at once, because "S, M, L" is one decision and half of
 * it applied is a product selling sizes nobody chose. A size that disappears is
 * deactivated rather than deleted as soon as it has any history, so its ledger
 * and the orders that name it survive.
 *
 * Stock for each size is shown but not edited here: adding or taking away units
 * goes through the stock adjustment endpoint, which writes to the ledger.
 */
export function VariantManager({ product }: { product: Product }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<VariantRow[]>(
    (product.variants ?? []).map((v) => ({
      id: v.id,
      label: v.label,
      isActive: v.isActive,
      stock: v.stock,
      inactive: !v.isActive,
    }))
  );
  const [newLabel, setNewLabel] = useState("");

  const addRow = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (rows.some((row) => row.label.toLowerCase() === label.toLowerCase())) {
      toast({ title: "Duplicate size", description: "Two sizes cannot have the same name.", tone: "error" });
      return;
    }
    setRows([...rows, { label, isActive: true }]);
    setNewLabel("");
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateLabel = (index: number, label: string) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, label } : row)));
  };

  const toggleActive = (index: number) => {
    setRows(rows.map((row, i) => (i === index ? { ...row, isActive: !row.isActive } : row)));
  };

  const handleSave = async () => {
    if (!token) return;
    const labels = rows.map((r) => r.label.trim());
    if (labels.some((l) => !l)) {
      toast({ title: "Empty label", description: "Every size needs a name.", tone: "error" });
      return;
    }
    if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) {
      toast({ title: "Duplicate size", description: "Two sizes cannot have the same name.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const payload: VariantInput[] = rows.map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        label: row.label.trim(),
        isActive: row.isActive,
      }));
      const { product: updated } = await updateVariants(token, product.id, payload);
      setRows(
        (updated.variants ?? []).map((v) => ({
          id: v.id,
          label: v.label,
          isActive: v.isActive,
          stock: v.stock,
          inactive: !v.isActive,
        }))
      );
      toast({ title: "Sizes saved", description: `${product.name} now has ${rows.length} size${rows.length === 1 ? "" : "s"}.`, tone: "success" });
    } catch (err) {
      toast({
        title: "Could not save sizes",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormCard
      title="Sizes"
      description="The whole set is saved at once. A size with orders or stock history is switched off, not deleted."
    >
      {rows.length > 0 ? (
        <ul className="space-y-2.5">
          {rows.map((row, index) => (
            <li key={row.id ?? `new-${index}`} className="flex items-center gap-3">
              <input
                value={row.label}
                onChange={(e) => updateLabel(index, e.target.value)}
                placeholder="S, M, L, XL..."
                className="min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
              />
              {row.stock != null && (
                <span className="shrink-0 text-xs font-semibold text-muted">
                  {row.stock} in stock
                </span>
              )}
              <button
                type="button"
                onClick={() => toggleActive(index)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  row.isActive
                    ? "bg-mint-100 text-mint-600 hover:bg-mint-200"
                    : "bg-surface text-faint hover:bg-lavender-50"
                )}
              >
                {row.isActive ? "Active" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label={`Remove size ${row.label}`}
                className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">This product has no sizes. Add one below if it comes in different sizes.</p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRow();
            }
          }}
          placeholder="New size label..."
          className="min-w-0 flex-1 rounded-xl border border-line-strong bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-lavender-400 focus:outline-none"
        />
        <Button type="button" variant="secondary" size="sm" onClick={addRow} disabled={!newLabel.trim()}>
          <Plus className="h-4 w-4" strokeWidth={2.3} />
          Add
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
        <Button type="button" onClick={handleSave} loading={saving} size="sm">
          {saving ? "Saving..." : "Save sizes"}
        </Button>
      </div>
    </FormCard>
  );
}
