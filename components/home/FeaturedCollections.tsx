import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories } from "../../lib/api";
import { collections as staticCollections } from "../../lib/nav";
import { RevealGroup, RevealItem } from "../motion/Reveal";
import { CategoryCard } from "../product/CategoryCard";
import { PastelTile } from "../ui/PastelTile";
import { SectionHeading } from "../ui/SectionHeading";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-shell py-14">
      <SectionHeading
        eyebrow="Collections"
        title="Three little worlds to wander"
        description="Kitchen, clothing and nails, each curated so everything plays nicely together."
      />
      <div className="mt-10">{children}</div>
    </section>
  );
}

/** Static fallback so a cold or failing API never breaks the homepage. */
function StaticGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {staticCollections.map((collection, index) => (
        <Link
          key={collection.slug}
          href={`/categories/${collection.slug}`}
          className="group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-5xl p-6 shadow-soft"
        >
          {collection.image ? (
            <Image
              src={collection.image}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 92vw"
              className={`object-cover ${collection.imageFocus} transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-105`}
            />
          ) : (
            <PastelTile seed={collection.slug} className="transition-transform duration-700 group-hover:scale-105" />
          )}

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-white/95 via-white/70 to-transparent"
          />

          <span className="relative">
            <span className="block font-display text-2xl text-ink">{collection.label}</span>
            <span className="mt-1 block max-w-xs text-sm leading-relaxed text-ink-700">{collection.blurb}</span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              Shop now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={2.4} />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export async function FeaturedCollections() {
  const categories = await getCategories()
    .then((data) => data.categories)
    .catch(() => []);

  if (categories.length === 0) {
    return (
      <Shell>
        <StaticGrid />
      </Shell>
    );
  }

  return (
    <Shell>
      <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
        {categories.slice(0, 6).map((category, index) => (
          <RevealItem key={category.id} className="h-full">
            <CategoryCard category={category} priority={index === 0} />
          </RevealItem>
        ))}
      </RevealGroup>
    </Shell>
  );
}
