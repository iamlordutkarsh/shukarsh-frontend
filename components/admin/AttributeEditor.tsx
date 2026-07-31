"use client";

import { useEffect, useState } from "react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteCategoryAttribute,
  getCategoryAttributes,
  saveCategoryAttribute,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { AttributeDefinition, AttributeKind } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import { FormField, inputClass, labelClass } from "./FormField";

const KINDS: { value: AttributeKind; label: string; hint: string }[] = [
  { value: "SELECT", label: "Pick one", hint: "Fabric, neck, sleeve length" },
  { value: "MULTISELECT", label: "Pick any", hint: "Occasion, features" },
  { value: "TEXT", label: "Free text", hint: "Anything a list cannot cover" },
  { value: "NUMBER", label: "A number", hint: "With a unit, like gsm" },
];

interface Draft {
  key: string;
  label: string;
  kind: AttributeKind;
  unit: string;
  required: boolean;
  filterable: boolean;
  /** One per line, which is how anybody actually types a list. */
  options: string;
  /** False once it exists: the key is its address, and links are built on it. */
  isNew: boolean;
}

function blankDraft(): Draft {
  return {
    key: "",
    label: "",
    kind: "SELECT",
    unit: "",
    required: false,
    filterable: true,
    options: "",
    isNew: true,
  };
}

function draftFrom(definition: AttributeDefinition): Draft {
  return {
    key: definition.key,
    label: definition.label,
    kind: definition.kind,
    unit: definition.unit ?? "",
    required: definition.required,
    filterable: definition.filterable,
    options: definition.options.map((option) => option.value).join("\n"),
    isNew: false,
  };
}

/** "Sleeve Length" becomes "sleeve-length", which is what the API accepts. */
function keyFrom(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * The questions one category asks about its products.
 *
 * Shows what it inherits as well as what it owns, because that is what the
 * product form will actually ask, and an admin looking at Tshirts wondering why
 * it wants a country of origin needs to see that the root is asking. Inherited
 * ones are read-only here: editing one would silently change every other
 * category under whoever defines it, so the change has to be made there.
 */
export function AttributeEditor({
  categoryId,
  categoryName,
}: {
  categoryId: string;
  categoryName: string;
}) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [attributes, setAttributes] = useState<AttributeDefinition[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;

    getCategoryAttributes(categoryId)
      .then((data) => {
        if (live) setAttributes(data.attributes);
      })
      .catch(() => {
        if (live) setAttributes([]);
      });

    return () => {
      live = false;
    };
  }, [categoryId]);

  const picks = draft?.kind === "SELECT" || draft?.kind === "MULTISELECT";

  const save = async () => {
    if (!draft || !token) return;

    const label = draft.label.trim();
    const key = draft.isNew ? keyFrom(draft.key.trim() || label) : draft.key;

    if (!label || !key) {
      toast({ title: "Needs a name", description: "Every question needs a label.", tone: "error" });
      return;
    }

    const options = draft.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (picks && options.length === 0) {
      toast({
        title: "Needs some choices",
        description: "A question people pick from needs at least one option.",
        tone: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const { attributes: next } = await saveCategoryAttribute(token, categoryId, key, {
        label,
        kind: draft.kind,
        unit: draft.kind === "NUMBER" ? draft.unit.trim() || null : null,
        required: draft.required,
        // Nobody filters a shop by free text, and the API would not honour it.
        filterable: picks ? draft.filterable : false,
        options: picks ? options : [],
      });

      setAttributes(next);
      setDraft(null);
      toast({ title: "Question saved", description: `${categoryName} now asks for ${label}.`, tone: "success" });
    } catch (err) {
      toast({
        title: "Could not save this question",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (definition: AttributeDefinition) => {
    if (!token) return;

    try {
      const { attributes: next } = await deleteCategoryAttribute(token, categoryId, definition.key);
      setAttributes(next);
      toast({ title: "Question removed", description: `${definition.label} is no longer asked.`, tone: "success" });
    } catch (err) {
      toast({
        title: "Could not remove this question",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    }
  };

  if (attributes === null) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading questions">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attributes.length > 0 ? (
        <ul className="space-y-2">
          {attributes.map((definition) => (
            <li
              key={definition.key}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-2xl px-3.5 py-2.5",
                definition.inherited ? "bg-surface-soft/60" : "bg-surface-soft"
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{definition.label}</span>
                <span className="block truncate text-xs text-muted">
                  {KINDS.find((kind) => kind.value === definition.kind)?.label}
                  {definition.options.length > 0 && ` · ${definition.options.length} choices`}
                  {definition.inherited && ` · asked by ${definition.categoryName}`}
                </span>
              </span>

              {definition.required && <Pill tone="peach">Required</Pill>}
              {definition.filterable && <Pill tone="mint">Filter</Pill>}

              {definition.inherited ? (
                <span
                  title={`Defined on ${definition.categoryName}. Edit it there.`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint"
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.3} />
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setDraft(draftFrom(definition))}
                    aria-label={`Edit ${definition.label}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-lavender-600"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(definition)}
                    aria-label={`Remove ${definition.label}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {categoryName} asks for nothing yet. Add a question and every product filed here, or under
          here, will be asked it.
        </p>
      )}

      {draft ? (
        <div className="space-y-4 rounded-3xl bg-surface-soft p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Question" htmlFor="attribute-label">
              <input
                id="attribute-label"
                value={draft.label}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    label: event.target.value,
                    // Follows the label only until it exists. After that the key
                    // is an address that filter links are built on.
                    key: draft.isNew ? keyFrom(event.target.value) : draft.key,
                  })
                }
                placeholder="Sleeve Length"
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Kind"
              htmlFor="attribute-kind"
              hint={KINDS.find((kind) => kind.value === draft.kind)?.hint}
            >
              <select
                id="attribute-kind"
                value={draft.kind}
                onChange={(event) => setDraft({ ...draft, kind: event.target.value as AttributeKind })}
                className={inputClass}
              >
                {KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {picks && (
            <FormField
              label="Choices"
              htmlFor="attribute-options"
              hint="One per line. This is the list the product form offers, and the only thing it will accept."
            >
              <textarea
                id="attribute-options"
                value={draft.options}
                onChange={(event) => setDraft({ ...draft, options: event.target.value })}
                rows={5}
                placeholder={"Half sleeve\nFull sleeve\nSleeveless"}
                className={cn(inputClass, "h-auto py-3")}
              />
            </FormField>
          )}

          {draft.kind === "NUMBER" && (
            <FormField label="Unit" htmlFor="attribute-unit" hint="Shown after the number. Optional.">
              <input
                id="attribute-unit"
                value={draft.unit}
                onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
                placeholder="gsm"
                className={inputClass}
              />
            </FormField>
          )}

          <div className="space-y-2">
            <span className={labelClass}>Rules</span>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(event) => setDraft({ ...draft, required: event.target.checked })}
                className="mt-0.5 h-4 w-4 rounded-md"
              />
              <span>
                <span className="block font-semibold text-ink">Required</span>
                <span className="block text-xs text-muted">
                  A product here cannot be saved without answering it.
                </span>
              </span>
            </label>

            {picks && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.filterable}
                  onChange={(event) => setDraft({ ...draft, filterable: event.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded-md"
                />
                <span>
                  <span className="block font-semibold text-ink">Offer as a filter</span>
                  <span className="block text-xs text-muted">
                    Shoppers can narrow the catalogue by it.
                  </span>
                </span>
              </label>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <Button type="button" size="sm" loading={saving} onClick={() => void save()}>
              {draft.isNew ? "Add question" : "Save question"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setDraft(blankDraft())}>
          <Plus className="h-4 w-4" strokeWidth={2.3} />
          Add question
        </Button>
      )}
    </div>
  );
}
