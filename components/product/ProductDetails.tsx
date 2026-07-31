import { Check } from "lucide-react";
import type { DetailBlock } from "../../lib/types";

/**
 * The long copy the shop wrote, drawn block by block.
 *
 * A server component: none of it moves, and the whole point of storing text
 * rather than markup is that the page decides what it looks like. Paragraphs
 * keep their line breaks, since somebody typing into a textarea means them.
 */
export function ProductDetails({ blocks }: { blocks: DetailBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-10">
      {blocks.map((block, index) => (
        <section key={index}>
          <h2 className="text-section text-balance">{block.title}</h2>

          {block.kind === "text" && (
            <p className="mt-4 whitespace-pre-line text-pretty text-[0.9375rem] leading-relaxed text-muted">
              {block.body}
            </p>
          )}

          {block.kind === "highlights" && (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-2.5 rounded-3xl bg-surface/70 px-4 py-3 text-[0.875rem] leading-relaxed text-ink-700 hairline"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-500" strokeWidth={2.6} />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {block.kind === "faq" && (
            <dl className="mt-5 space-y-4">
              {block.items.map((item, itemIndex) => (
                <div key={itemIndex} className="rounded-3xl bg-surface/70 px-5 py-4 hairline">
                  <dt className="text-[0.9375rem] font-semibold text-ink">{item.question}</dt>
                  <dd className="mt-1.5 whitespace-pre-line text-[0.875rem] leading-relaxed text-muted">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </div>
  );
}
