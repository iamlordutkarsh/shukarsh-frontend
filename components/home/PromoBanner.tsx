import { ArrowRight, Sparkles } from "lucide-react";
import { Parallax } from "../motion/Parallax";
import { Reveal } from "../motion/Reveal";
import { ButtonLink } from "../ui/Button";
import { PastelTile } from "../ui/PastelTile";

const perks = ["Ready in five minutes", "Reusable up to 10 wears", "20+ shapes and shades"];

export function PromoBanner() {
  return (
    <section className="section-shell py-14">
      <Reveal variant="scale">
        <div className="relative overflow-hidden rounded-5xl bg-gradient-to-br from-lavender-500 via-lavender-500 to-blush-400 p-8 text-white shadow-lift sm:p-12">
          <div
            aria-hidden
            className="absolute -right-16 -top-24 h-72 w-72 rounded-[var(--radius-blob)] bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="animate-float-slow absolute -bottom-20 left-1/4 h-64 w-64 rounded-[var(--radius-blob)] bg-peach-200/25 blur-2xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                The nail edit
              </span>
              <h2 className="text-hero text-balance text-white">Salon nails, sofa energy</h2>
              <p className="max-w-md text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
                Press-on sets that look done, feel light and come off without a single tear. Pick a shape, press,
                go live your life.
              </p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-[0.8125rem] font-medium text-white/85">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white/70" />
                    {perk}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/categories/artificial-nails" variant="secondary" size="lg" className="text-ink">
                Shop the nail edit
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </ButtonLink>
            </div>

            <Parallax distance={-30} className="hidden lg:block">
              <div className="relative grid grid-cols-2 gap-4">
                <div className="relative aspect-square overflow-hidden rounded-4xl shadow-soft">
                  <PastelTile seed="nails-a" />
                </div>
                <div className="relative mt-8 aspect-square overflow-hidden rounded-4xl shadow-soft">
                  <PastelTile seed="nails-b" />
                </div>
              </div>
            </Parallax>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
