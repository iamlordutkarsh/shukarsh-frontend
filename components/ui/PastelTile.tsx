import { cn } from "../../lib/utils";

export const pastelPalettes = [
  "from-lavender-200 via-lavender-100 to-blush-100",
  "from-blush-200 via-blush-100 to-peach-100",
  "from-peach-200 via-peach-100 to-lavender-100",
  "from-mint-200 via-mint-100 to-lavender-100",
] as const;

export function paletteFor(seed: string | number) {
  const value =
    typeof seed === "number"
      ? seed
      : seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return pastelPalettes[Math.abs(value) % pastelPalettes.length];
}

/**
 * Zero-byte decorative background used wherever a product/category has no
 * photo, and for purely ornamental panels. Pure CSS + inline SVG, so it costs
 * no network request and cannot break.
 */
export function PastelTile({
  seed = 0,
  className,
  glyph = true,
}: {
  seed?: string | number;
  className?: string;
  glyph?: boolean;
}) {
  return (
    <div aria-hidden className={cn("absolute inset-0 bg-gradient-to-br", paletteFor(seed), className)}>
      <svg className="h-full w-full opacity-60" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`dots-${String(seed)}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.6" fill="white" opacity="0.7" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#dots-${String(seed)})`} />
        <circle cx="42" cy="52" r="34" fill="white" opacity="0.28" />
        <circle cx="158" cy="146" r="46" fill="white" opacity="0.2" />
        {glyph && (
          <g transform="translate(100 100)" fill="white" opacity="0.75">
            <path d="M0-30c1.6 12.4 5.8 20 16.4 24-10.6 4-14.8 11.6-16.4 24-1.6-12.4-5.8-20-16.4-24C-5.8-10-1.6-17.6 0-30Z" />
          </g>
        )}
      </svg>
    </div>
  );
}
