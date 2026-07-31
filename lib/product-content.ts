import type { DetailBlock, ProductSpec } from "./types";

/**
 * Drops the rows an admin started and did not finish.
 *
 * The API refuses a blank label or an empty bullet, so one abandoned row would
 * fail a save that is otherwise complete. Trimming here rather than there keeps
 * the rule where it belongs: an empty box is not a validation error, it is
 * somebody who changed their mind.
 */
export function cleanSpecs(specs: ProductSpec[]): ProductSpec[] {
  return specs
    .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
    .filter((spec) => spec.label && spec.value);
}

/** The same for the long copy. A block left with nothing in it is dropped whole. */
export function cleanDetails(blocks: DetailBlock[]): DetailBlock[] {
  return blocks.flatMap((block): DetailBlock[] => {
    const title = block.title.trim();
    if (!title) return [];

    if (block.kind === "text") {
      const body = block.body.trim();
      return body ? [{ kind: "text", title, body }] : [];
    }

    if (block.kind === "highlights") {
      const items = block.items.map((item) => item.trim()).filter(Boolean);
      return items.length > 0 ? [{ kind: "highlights", title, items }] : [];
    }

    const items = block.items
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer);
    return items.length > 0 ? [{ kind: "faq", title, items }] : [];
  });
}
