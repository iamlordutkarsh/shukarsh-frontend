import { Camera } from "lucide-react";
import { RevealGroup, RevealItem } from "../motion/Reveal";
import { instagramHandle, instagramUrl } from "../../lib/shop";
import { PastelTile } from "../ui/PastelTile";
import { SectionHeading } from "../ui/SectionHeading";

const tiles = ["studio-1", "studio-2", "studio-3", "studio-4", "studio-5", "studio-6"];

export function InstagramStrip() {
  const profile = instagramUrl();
  // Six tiles inviting a follow, with nowhere to follow to, is worse than no
  // section at all — so the whole strip goes when there is no account to link.
  if (!profile) return null;

  return (
    <section className="section-shell py-8 sm:py-10">
      <SectionHeading
        eyebrow={instagramHandle() ?? undefined}
        title="Come hang out on Instagram"
        description="Behind the scenes, restock alerts and far too many pastel flat lays."
      />

      <RevealGroup className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6" stagger={0.05}>
        {tiles.map((tile) => (
          <RevealItem key={tile}>
            <a
              href={profile}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open Shukarsh on Instagram"
              className="group relative block aspect-square overflow-hidden rounded-3xl shadow-soft"
            >
              <PastelTile seed={tile} className="transition-transform duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 grid place-items-center bg-ink-900/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" strokeWidth={2.2} />
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
