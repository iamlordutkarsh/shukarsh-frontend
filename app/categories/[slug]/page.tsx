import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCategory } from "../../../lib/api";
import type { Product } from "../../../lib/types";
import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { ProductCard } from "../../../components/product/ProductCard";
import { ButtonLink } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug)
    .then((data) => data.category)
    .catch(() => null);

  if (!category) return { title: "Collection not found" };

  return {
    title: category.name,
    description: category.description ?? `Shop the ${category.name} collection at Shukarsh.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategory(slug)
    .then((data) => data.category)
    .catch(() => null);

  if (!category) notFound();

  /** The category endpoint omits the nested category on each product. */
  const products: Product[] = category.products.map((product) => ({
    ...product,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
    },
  }));

  return (
    <div className="relative pb-20 pt-8">
      <FloatingDecor className="h-[26rem] opacity-70" />

      <div className="section-shell relative">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          <Link href="/products" className="transition-colors hover:text-ink">
            Shop
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-faint" strokeWidth={2.4} />
          <span className="font-medium text-ink">{category.name}</span>
        </nav>

        <header className="mx-auto mt-8 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-lavender-100/80 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-lavender-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blush-400" />
            Collection
          </span>
          <h1 className="mt-4 text-hero text-balance">{category.name}</h1>
          {category.description && (
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">
              {category.description}
            </p>
          )}
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-faint">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
        </header>

        <div className="mt-12">
          {products.length === 0 ? (
            <EmptyState
              art={<NoResultsArt />}
              title="This shelf is being restocked"
              description="Nothing here just yet. Have a wander through the rest of the shop while we refill it."
              action={<ButtonLink href="/products">Browse everything</ButtonLink>}
            />
          ) : (
            <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" stagger={0.05}>
              {products.map((product, index) => (
                <RevealItem key={product.id} className="h-full">
                  <ProductCard product={product} priority={index < 4} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </div>
  );
}
