import { cn } from "../../lib/utils";

/**
 * The circle that stands for a colour.
 *
 * One component because the product page, the card and two admin screens all
 * draw it, and a swatch that renders differently in the admin from the shop is a
 * shop whose colours cannot be trusted.
 *
 * A second hex splits it down the diagonal, which is how a print or a stripe gets
 * represented at all: those are not one colour, and painting them a single
 * average is worse than admitting it. With no hex at all it falls back to a
 * neutral chip — a colour nobody can name in hex is still a colour worth selling.
 */
export function Swatch({
  hex,
  hex2,
  className,
}: {
  hex?: string | null;
  hex2?: string | null;
  className?: string;
}) {
  const base = hex ?? "#e7e3f0";

  return (
    <span
      aria-hidden
      className={cn("block rounded-full", className)}
      // The only place a shop-chosen colour can land: a hex is not expressible
      // as a utility class, and there is no palette to map it onto.
      style={{
        background: hex2 ? `linear-gradient(135deg, ${base} 0%, ${base} 50%, ${hex2} 50%, ${hex2} 100%)` : base,
      }}
    />
  );
}
