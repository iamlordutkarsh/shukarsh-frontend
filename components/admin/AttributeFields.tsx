"use client";

import type { AttributeDefinition } from "../../lib/types";
import { cn } from "../../lib/utils";
import { FormField, inputClass, labelClass } from "./FormField";

/** One product's answers, keyed by the definition's key. */
export type AttributeAnswers = Record<string, string[]>;

/**
 * The answers a product carries, as the form holds them.
 *
 * Everything is a list of strings, whatever the kind: a SELECT is a list of one,
 * a NUMBER is its digits. Keeping one shape means the form does not branch on
 * kind to read or write, only to draw, and the API parses on the way in — which
 * it has to do regardless, since a browser is not where validation belongs.
 */
export function answersFromProduct(
  attributes: { key: string; values: string[] }[] | undefined
): AttributeAnswers {
  const answers: AttributeAnswers = {};
  for (const attribute of attributes ?? []) answers[attribute.key] = attribute.values;
  return answers;
}

/** The payload shape the products endpoint takes. */
export function answersToPayload(
  definitions: AttributeDefinition[],
  answers: AttributeAnswers
): { key: string; values: string[]; text?: string | null; number?: number | null }[] {
  return definitions.flatMap((definition) => {
    const values = (answers[definition.key] ?? []).filter(Boolean);
    if (values.length === 0) return [];

    if (definition.kind === "TEXT") return [{ key: definition.key, values: [], text: values[0] }];
    if (definition.kind === "NUMBER") {
      const parsed = Number(values[0]);
      return Number.isFinite(parsed) ? [{ key: definition.key, values: [], number: parsed }] : [];
    }

    return [{ key: definition.key, values }];
  });
}

/**
 * The part of the product form the category decides.
 *
 * Drawn from the category's own questions plus every one it inherits, so filing
 * a product under Tshirts is what asks it for a sleeve length. The alternative —
 * one fixed form with every field any product might need — is a form that is
 * mostly blank on everything and filterable on nothing.
 */
export function AttributeFields({
  definitions,
  answers,
  onChange,
  loading,
}: {
  definitions: AttributeDefinition[];
  answers: AttributeAnswers;
  onChange: (answers: AttributeAnswers) => void;
  loading?: boolean;
}) {
  const set = (key: string, values: string[]) => onChange({ ...answers, [key]: values });

  if (loading) {
    return <p className="text-sm text-muted">Loading what this category asks for...</p>;
  }

  if (definitions.length === 0) {
    return (
      <p className="text-sm text-muted">
        This category asks for nothing beyond the basics. Add questions to it from the categories
        screen and they will appear here.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {definitions.map((definition) => {
        const values = answers[definition.key] ?? [];
        const id = `attribute-${definition.key}`;

        const hint = [
          definition.inherited && definition.categoryName
            ? `Asked by ${definition.categoryName}`
            : null,
          definition.unit ? `In ${definition.unit}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        if (definition.kind === "MULTISELECT") {
          return (
            <div key={definition.key} className="space-y-2 sm:col-span-2">
              <span className={labelClass}>
                {definition.label}
                {definition.required && <span className="ml-1 text-rose-500">*</span>}
              </span>
              <div className="flex flex-wrap gap-2">
                {definition.options.map((option) => {
                  const picked = values.includes(option.value);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={picked}
                      onClick={() =>
                        set(
                          definition.key,
                          picked
                            ? values.filter((value) => value !== option.value)
                            : [...values, option.value]
                        )
                      }
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                        picked
                          ? "bg-ink text-white"
                          : "bg-lavender-50 text-lavender-700 hover:bg-lavender-100"
                      )}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
              {hint && <p className="text-xs text-muted">{hint}</p>}
            </div>
          );
        }

        return (
          <FormField
            key={definition.key}
            htmlFor={id}
            label={`${definition.label}${definition.required ? " *" : ""}`}
            hint={hint || undefined}
          >
            {definition.kind === "SELECT" ? (
              <select
                id={id}
                value={values[0] ?? ""}
                onChange={(event) =>
                  set(definition.key, event.target.value ? [event.target.value] : [])
                }
                className={inputClass}
              >
                <option value="">Select</option>
                {definition.options.map((option) => (
                  <option key={option.id} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                value={values[0] ?? ""}
                onChange={(event) =>
                  set(definition.key, event.target.value ? [event.target.value] : [])
                }
                inputMode={definition.kind === "NUMBER" ? "decimal" : "text"}
                placeholder={definition.kind === "NUMBER" ? "0" : definition.label}
                className={inputClass}
              />
            )}
          </FormField>
        );
      })}
    </div>
  );
}
