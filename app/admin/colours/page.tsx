"use client";

import { useEffect, useState } from "react";
import { Palette, Plus, Trash2 } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { Swatch } from "../../../components/product/Swatch";
import { inputClass } from "../../../components/admin/FormField";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { getColourPalette, saveColourPalette, type ColourPresetInput } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { cn } from "../../../lib/utils";

interface Row extends ColourPresetInput {
  /** Held apart from hex2 so unticking two-tone does not lose what was picked. */
  twoTone: boolean;
}

/**
 * The shop's own list of colours.
 *
 * Exists because a product's colour name is free text, and free text drifts:
 * "Navy" on one product, "navy blue" on the next, "Dark Blue" on the third, and
 * they are three colours with three sets of photos that no filter can bring
 * together. Picking from a list at the point of typing is what stops that.
 *
 * It guides rather than governs. A product keeps its own copy of the name and the
 * hex, so retiring a colour here cannot repaint what is already published, and a
 * one-off colour that never joins the list is still possible.
 */
export default function AdminColoursPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let live = true;

    getColourPalette(token)
      .then((data) => {
        if (!live) return;
        setRows(
          data.colours.map((colour) => ({
            id: colour.id,
            name: colour.name,
            hex: colour.hex,
            hex2: colour.hex2,
            twoTone: Boolean(colour.hex2),
          }))
        );
      })
      .catch(() => {
        if (live) setRows([]);
      });

    return () => {
      live = false;
    };
  }, [token]);

  const update = (index: number, patch: Partial<Row>) => {
    setRows((current) =>
      (current ?? []).map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const save = async () => {
    if (!token || !rows) return;

    const names = rows.map((row) => row.name.trim());
    if (names.some((name) => !name)) {
      toast({ title: "Empty colour", description: "Every colour needs a name.", tone: "error" });
      return;
    }
    if (new Set(names.map((name) => name.toLowerCase())).size !== names.length) {
      toast({ title: "Duplicate colour", description: "Two colours cannot have the same name.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      const { colours } = await saveColourPalette(
        token,
        rows.map((row) => ({
          ...(row.id ? { id: row.id } : {}),
          name: row.name.trim(),
          hex: row.hex ?? null,
          // Only sent when the row is actually two-tone, so a hex left over from
          // a box that has since been unticked does not quietly reappear.
          hex2: row.twoTone ? (row.hex2 ?? null) : null,
        }))
      );

      setRows(
        colours.map((colour) => ({
          id: colour.id,
          name: colour.name,
          hex: colour.hex,
          hex2: colour.hex2,
          twoTone: Boolean(colour.hex2),
        }))
      );
      toast({ title: "Palette saved", description: `${colours.length} colours ready to use.`, tone: "success" });
    } catch (err) {
      toast({
        title: "Could not save the palette",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Colours"
      subtitle="The shop's palette. Products pick from this so one colour does not end up spelled three ways."
    >
      <div className="max-w-3xl rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-lavender-100 text-lavender-700">
            <Palette className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <h2 className="text-lg text-ink">Palette</h2>
        </div>

        <div className="mt-5">
          {rows === null ? (
            <div className="space-y-2" role="status" aria-label="Loading palette">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted">
              No colours yet. Add the ones you actually sell, and they will be offered whenever a
              product needs a colour.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {rows.map((row, index) => (
                <li key={row.id ?? `new-${index}`} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-soft px-3.5 py-2.5">
                  <span className="shrink-0 rounded-full ring-1 ring-line-strong">
                    <Swatch hex={row.hex} hex2={row.twoTone ? row.hex2 : null} className="h-9 w-9" />
                  </span>

                  <input
                    value={row.name}
                    onChange={(event) => update(index, { name: event.target.value })}
                    placeholder="Midnight blue"
                    aria-label={`Colour ${index + 1} name`}
                    className={cn(inputClass, "h-11 min-w-0 flex-1")}
                  />

                  <input
                    type="color"
                    value={row.hex ?? "#cccccc"}
                    onChange={(event) => update(index, { hex: event.target.value })}
                    aria-label={`Colour for ${row.name || `row ${index + 1}`}`}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-line-strong bg-white p-0.5"
                  />

                  {row.twoTone && (
                    <input
                      type="color"
                      value={row.hex2 ?? "#888888"}
                      onChange={(event) => update(index, { hex2: event.target.value })}
                      aria-label={`Second colour for ${row.name || `row ${index + 1}`}`}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-line-strong bg-white p-0.5"
                    />
                  )}

                  <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted">
                    <input
                      type="checkbox"
                      checked={row.twoTone}
                      onChange={(event) =>
                        update(index, {
                          twoTone: event.target.checked,
                          hex2: event.target.checked ? (row.hex2 ?? "#888888") : row.hex2,
                        })
                      }
                      className="h-4 w-4 rounded-md"
                    />
                    Two-tone
                  </label>

                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((_, i) => i !== index))}
                    aria-label={`Remove ${row.name || `colour ${index + 1}`}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          Two-tone is for a print or a stripe that no single colour describes. The swatch is split
          between the two.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setRows([...(rows ?? []), { name: "", hex: "#cccccc", hex2: null, twoTone: false }])
            }
          >
            <Plus className="h-4 w-4" strokeWidth={2.3} />
            Add colour
          </Button>

          <Button type="button" size="sm" loading={saving} disabled={rows === null} onClick={() => void save()}>
            {saving ? "Saving..." : "Save palette"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
