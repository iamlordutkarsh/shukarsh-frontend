import { cn } from "../../lib/utils";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 0c.7 4.9 2.4 7.9 6.6 9.4C14.4 10.9 12.7 14 12 19c-.7-5-2.4-8.1-6.6-9.6C9.6 7.9 11.3 4.9 12 0Z" />
    </svg>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 21s-7.6-4.7-9.3-9.2C1.3 8.2 3.2 5 6.6 5c2 0 3.5 1.1 4.4 2.6h2c.9-1.5 2.4-2.6 4.4-2.6 3.4 0 5.3 3.2 3.9 6.8C19.6 16.3 12 21 12 21Z" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2.5 14.9 9l7.1.7-5.3 4.8 1.5 7-6.2-3.6L5.8 21.5l1.5-7L2 9.7 9.1 9 12 2.5Z" />
    </svg>
  );
}

/**
 * Purely decorative pastel blobs + kawaii glyphs. CSS-animated only, so it
 * costs no JavaScript and stays on the compositor thread.
 */
export function FloatingDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="animate-float-slow absolute -left-24 top-4 h-72 w-72 rounded-[var(--radius-blob)] bg-lavender-200/45 blur-3xl" />
      <div className="animate-float absolute -right-16 top-24 h-64 w-64 rounded-[var(--radius-blob)] bg-blush-200/45 blur-3xl [animation-delay:-2.5s]" />
      <div className="animate-drift absolute bottom-0 left-1/3 h-56 w-56 rounded-[var(--radius-blob)] bg-peach-200/40 blur-3xl" />

      <Sparkle className="animate-twinkle absolute left-[12%] top-[22%] h-5 w-5 text-lavender-400" />
      <Sparkle className="animate-twinkle absolute right-[14%] top-[62%] h-4 w-4 text-blush-400 [animation-delay:-1.2s]" />
      <Star className="animate-float absolute right-[26%] top-[14%] h-4 w-4 text-peach-400 [animation-delay:-3s]" />
      <Heart className="animate-float-slow absolute left-[26%] bottom-[16%] h-4 w-4 text-blush-300 [animation-delay:-1.8s]" />
      <Star className="animate-twinkle absolute left-[62%] bottom-[28%] h-3 w-3 text-lavender-300 [animation-delay:-2.2s]" />
    </div>
  );
}
