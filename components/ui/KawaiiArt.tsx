import { cn } from "../../lib/utils";

interface ArtProps {
  className?: string;
}

/** Shared face used by every mascot so the illustration set feels like a family. */
function Face({ x = 0, y = 0, mood = "happy" }: { x?: number; y?: number; mood?: "happy" | "sleepy" | "wow" }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {mood === "sleepy" ? (
        <>
          <path d="M-13 -2c3 3 7 3 10 0" stroke="#3B3159" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M3 -2c3 3 7 3 10 0" stroke="#3B3159" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="-8" cy="-2" rx="3.1" ry="3.8" fill="#3B3159" />
          <ellipse cx="8" cy="-2" rx="3.1" ry="3.8" fill="#3B3159" />
          <circle cx="-6.8" cy="-3.6" r="1.1" fill="#fff" />
          <circle cx="9.2" cy="-3.6" r="1.1" fill="#fff" />
        </>
      )}
      {mood === "wow" ? (
        <ellipse cx="0" cy="7" rx="3.4" ry="4.2" fill="#FF6FA3" opacity="0.85" />
      ) : (
        <path d="M-4.5 6c1.6 2.4 7.4 2.4 9 0" stroke="#3B3159" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      <ellipse cx="-16" cy="5" rx="4.6" ry="2.8" fill="#FFB1CD" opacity="0.75" />
      <ellipse cx="16" cy="5" rx="4.6" ry="2.8" fill="#FFB1CD" opacity="0.75" />
    </g>
  );
}

function Sparkles() {
  return (
    <g fill="#A88DFF">
      <path d="M28 34c.5 3.4 1.7 5.5 4.6 6.5-2.9 1-4.1 3.1-4.6 6.5-.5-3.4-1.7-5.5-4.6-6.5 2.9-1 4.1-3.1 4.6-6.5Z" />
      <path
        d="M170 44c.4 2.7 1.3 4.3 3.6 5.1-2.3.8-3.2 2.4-3.6 5.1-.4-2.7-1.3-4.3-3.6-5.1 2.3-.8 3.2-2.4 3.6-5.1Z"
        fill="#FF93B8"
      />
      <circle cx="150" cy="26" r="3" fill="#FFBB99" />
      <circle cx="44" cy="140" r="2.6" fill="#FF93B8" />
    </g>
  );
}

/** Empty cart: a soft tote with a snoozing mascot inside. */
export function EmptyCartArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 170" className={cn("h-auto w-full", className)} role="img" aria-label="An empty shopping bag">
      <ellipse cx="100" cy="150" rx="62" ry="9" fill="#DCCDFF" opacity="0.55" />
      <Sparkles />
      <path
        d="M52 58h96l8 76a14 14 0 0 1-14 15H58a14 14 0 0 1-14-15l8-76Z"
        fill="url(#bagFill)"
        stroke="#C5AEFF"
        strokeWidth="3"
      />
      <path d="M76 58V46a24 24 0 0 1 48 0v12" fill="none" stroke="#C5AEFF" strokeWidth="4.5" strokeLinecap="round" />
      <g transform="translate(100 106)">
        <Face mood="sleepy" />
      </g>
      <path d="M86 128c8 5 20 5 28 0" stroke="#FFB1CD" strokeWidth="3" strokeLinecap="round" fill="none" />
      <defs>
        <linearGradient id="bagFill" x1="44" y1="46" x2="156" y2="149" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4F8" />
          <stop offset="0.55" stopColor="#F7F3FF" />
          <stop offset="1" stopColor="#EDE5FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** No search results: mascot peeking through a magnifier. */
export function NoResultsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 170" className={cn("h-auto w-full", className)} role="img" aria-label="Nothing found">
      <ellipse cx="100" cy="152" rx="58" ry="9" fill="#DCCDFF" opacity="0.5" />
      <Sparkles />
      <circle cx="92" cy="80" r="46" fill="url(#lensFill)" stroke="#C5AEFF" strokeWidth="4" />
      <g transform="translate(92 80)">
        <Face mood="wow" />
      </g>
      <path d="M126 116l28 28" stroke="#A88DFF" strokeWidth="12" strokeLinecap="round" />
      <path d="M126 116l28 28" stroke="#C5AEFF" strokeWidth="5" strokeLinecap="round" />
      <defs>
        <linearGradient id="lensFill" x1="46" y1="34" x2="138" y2="126" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFBF4" />
          <stop offset="1" stopColor="#FFE7F0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Empty wishlist / empty list: a floating heart balloon mascot. */
export function EmptyHeartArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 170" className={cn("h-auto w-full", className)} role="img" aria-label="Nothing saved yet">
      <ellipse cx="100" cy="154" rx="50" ry="8" fill="#FFD0E2" opacity="0.6" />
      <Sparkles />
      <path
        d="M100 138s-44-26-54-52C36 65 47 46 66 46c12 0 20 6 25 14h18c5-8 13-14 25-14 19 0 30 19 20 40-10 26-54 52-54 52Z"
        fill="url(#heartFill)"
        stroke="#FFB1CD"
        strokeWidth="3.5"
      />
      <g transform="translate(100 86)">
        <Face />
      </g>
      <defs>
        <linearGradient id="heartFill" x1="46" y1="46" x2="154" y2="138" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4F8" />
          <stop offset="1" stopColor="#FFE7F0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Generic mascot used in error / offline states. */
export function OopsArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 200 170" className={cn("h-auto w-full", className)} role="img" aria-label="Something went wrong">
      <ellipse cx="100" cy="152" rx="56" ry="9" fill="#DCCDFF" opacity="0.5" />
      <Sparkles />
      <path
        d="M56 66c0-24 20-40 44-40s44 16 44 40v34c0 24-20 40-44 40s-44-16-44-40V66Z"
        fill="url(#blobFill)"
        stroke="#C5AEFF"
        strokeWidth="3.5"
      />
      <path d="M72 34l-10-14M128 34l10-14" stroke="#C5AEFF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="62" cy="20" r="4.5" fill="#FF93B8" />
      <circle cx="138" cy="20" r="4.5" fill="#FFBB99" />
      <g transform="translate(100 92)">
        <Face mood="wow" />
      </g>
      <defs>
        <linearGradient id="blobFill" x1="56" y1="26" x2="144" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7F3FF" />
          <stop offset="1" stopColor="#EDE5FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}
