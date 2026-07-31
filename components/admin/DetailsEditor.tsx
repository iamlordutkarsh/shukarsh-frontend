"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { DetailBlock } from "../../lib/types";
import { Button } from "../ui/Button";
import { inputClass, textareaClass } from "./FormField";
import { cn } from "../../lib/utils";

const KINDS: { kind: DetailBlock["kind"]; label: string; title: string }[] = [
  { kind: "text", label: "Paragraph", title: "About this piece" },
  { kind: "highlights", label: "Bullet list", title: "Why you will like it" },
  { kind: "faq", label: "Questions", title: "Questions people ask" },
];

function blankBlock(kind: DetailBlock["kind"], title: string): DetailBlock {
  if (kind === "text") return { kind, title, body: "" };
  if (kind === "highlights") return { kind, title, items: [""] };
  return { kind, title, items: [{ question: "", answer: "" }] };
}

function move(blocks: DetailBlock[], from: number, to: number): DetailBlock[] {
  if (to < 0 || to >= blocks.length) return blocks;
  const next = [...blocks];
  const [block] = next.splice(from, 1);
  next.splice(to, 0, block);
  return next;
}

/**
 * The long copy under a product, written as blocks.
 *
 * Three shapes rather than one rich-text box: the product page draws each of
 * them differently, and a single blob of HTML from an admin form is both a
 * styling problem and somewhere for a script tag to live. What the shop types
 * here is text, and the page decides what it looks like.
 *
 * Empty blocks and empty rows are dropped by the API on save, so a half written
 * FAQ never blocks the form.
 */
export function DetailsEditor({
  value,
  onChange,
}: {
  value: DetailBlock[];
  onChange: (blocks: DetailBlock[]) => void;
}) {
  const update = (index: number, block: DetailBlock) => {
    onChange(value.map((existing, i) => (i === index ? block : existing)));
  };

  return (
    <div className="space-y-4">
      {value.length > 0 ? (
        <ul className="space-y-4">
          {value.map((block, index) => (
            <li key={index} className="rounded-3xl bg-surface-soft p-4">
              <div className="flex items-center gap-2">
                <input
                  value={block.title}
                  onChange={(e) => update(index, { ...block, title: e.target.value })}
                  placeholder="Section heading"
                  aria-label={`Section ${index + 1} heading`}
                  className={cn(inputClass, "h-11 min-w-0 flex-1 font-semibold")}
                />
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onChange(move(value, index, index - 1))}
                    disabled={index === 0}
                    aria-label={`Move ${block.title || "section"} up`}
                    className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-lavender-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(move(value, index, index + 1))}
                    disabled={index === value.length - 1}
                    aria-label={`Move ${block.title || "section"} down`}
                    className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-lavender-50 hover:text-lavender-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                    aria-label={`Remove ${block.title || "section"}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                {block.kind === "text" && (
                  <textarea
                    value={block.body}
                    onChange={(e) => update(index, { ...block, body: e.target.value })}
                    rows={4}
                    placeholder="Write it the way you would say it out loud."
                    aria-label={`${block.title || "Section"} text`}
                    className={textareaClass}
                  />
                )}

                {block.kind === "highlights" && (
                  <div className="space-y-2">
                    {block.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <span aria-hidden className="text-lavender-400">
                          &bull;
                        </span>
                        <input
                          value={item}
                          onChange={(e) =>
                            update(index, {
                              ...block,
                              items: block.items.map((existing, i) =>
                                i === itemIndex ? e.target.value : existing
                              ),
                            })
                          }
                          placeholder="One short line"
                          aria-label={`Bullet ${itemIndex + 1}`}
                          className={cn(inputClass, "h-11 min-w-0 flex-1")}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(index, {
                              ...block,
                              items: block.items.filter((_, i) => i !== itemIndex),
                            })
                          }
                          aria-label={`Remove bullet ${itemIndex + 1}`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => update(index, { ...block, items: [...block.items, ""] })}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.3} />
                      Add bullet
                    </Button>
                  </div>
                )}

                {block.kind === "faq" && (
                  <div className="space-y-3">
                    {block.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-2 rounded-2xl bg-white/70 p-3">
                        <div className="flex items-center gap-2">
                          <input
                            value={item.question}
                            onChange={(e) =>
                              update(index, {
                                ...block,
                                items: block.items.map((existing, i) =>
                                  i === itemIndex ? { ...existing, question: e.target.value } : existing
                                ),
                              })
                            }
                            placeholder="Does it come with a lid?"
                            aria-label={`Question ${itemIndex + 1}`}
                            className={cn(inputClass, "h-11 min-w-0 flex-1 font-semibold")}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              update(index, {
                                ...block,
                                items: block.items.filter((_, i) => i !== itemIndex),
                              })
                            }
                            aria-label={`Remove question ${itemIndex + 1}`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                          </button>
                        </div>
                        <textarea
                          value={item.answer}
                          onChange={(e) =>
                            update(index, {
                              ...block,
                              items: block.items.map((existing, i) =>
                                i === itemIndex ? { ...existing, answer: e.target.value } : existing
                              ),
                            })
                          }
                          rows={2}
                          placeholder="It does, and it is oven safe to 180C."
                          aria-label={`Answer ${itemIndex + 1}`}
                          className={textareaClass}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        update(index, { ...block, items: [...block.items, { question: "", answer: "" }] })
                      }
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.3} />
                      Add question
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Nothing here yet. The short description above is what a shopper reads first; this is for
          everything that did not fit in it.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {KINDS.map(({ kind, label, title }) => (
          <Button
            key={kind}
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange([...value, blankBlock(kind, title)])}
          >
            <Plus className="h-4 w-4" strokeWidth={2.3} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
