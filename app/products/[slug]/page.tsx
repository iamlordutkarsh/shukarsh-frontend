import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Suspense } from "react";
import { getProduct, getProducts } from "../../../lib/api";
import { discountPercent, formatPrice } from "../../../lib/utils";
import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AddToCartButton } from "../../../components/product/AddToCartButton";
import { ShareButton } from "../../../components/product/ShareButton";
import { ProductCard } from "../../../components/product/ProductCard";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { Accordion } from "../../../components/ui/Accordion";
import { Pill } from "../../../components/ui/Pill";
import { ProductGridSkeleton } from "../../../components/ui/Skeleton";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug)
    .then((data) => data.product)
    .catch(() => null);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? `Shop ${product.name} at Shukarsh.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      images: product.images.length > 0 ? [product.images[0] as string] : undefined,
    },
  };
}

async function RelatedProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const products = await getProducts({ categoryId, limit: 5 })
    .then((data) => data.products.filter((item) => item.id !== excludeId).slice(0, 4))
    .catch(() => []);

  if (products.length === 0) return null;

  return (
    <section className="section-shell pb-4 pt-20">
      <Reveal>
        <h2 className="text-section text-balance">You may also love</h2>
      </Reveal>
      <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" stagger={0.06}>
        {products.map((product) => (
          <RevealItem key={product.id} className="h-full">
            <ProductCard product={product} />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug)
    .then((data) => data.product)
    .catch(() => null);

  if (!product) notFound();

  const comparePrice = product.comparePrice;
  const discount = discountPercent(product.price, comparePrice);
  const soldOut = product.stock <= 0;

  return (
    <div className="relative pb-20 pt-8">
      <FloatingDecor className="h-[32rem] opacity-60" />

      <div className="section-shell relative">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          <Link href="/products" className="transition-colors hover:text-ink">
            Shop
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-faint" strokeWidth={2.4} />
          <Link href={`/categories/${product.category.slug}`} className="transition-colors hover:text-ink">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-faint" strokeWidth={2.4} />
          <span className="truncate font-medium text-ink">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={product.images}
              name={product.name}
              seed={product.slug}
              badge={
                <>
                  {discount !== null && (
                    <span className="rounded-full bg-gradient-to-r from-blush-400 to-peach-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-soft">
                      {discount}% off
                    </span>
                  )}
                  {soldOut && (
                    <span className="rounded-full bg-ink-900/85 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                      Sold out
                    </span>
                  )}
                </>
              }
            />
          </div>

          <div className="space-y-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="lavender">{product.category.name}</Pill>
                {!soldOut && product.stock <= 5 && <Pill tone="peach">Only {product.stock} left</Pill>}
                {!soldOut && product.stock > 5 && <Pill tone="mint">In stock</Pill>}
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-hero text-balance">{product.name}</h1>
                <ShareButton name={product.name} />
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold tracking-tight text-ink">{formatPrice(product.price)}</span>
                {comparePrice && comparePrice > product.price && (
                  <span className="text-base text-faint line-through">{formatPrice(comparePrice)}</span>
                )}
                {discount !== null && (
                  <span className="text-sm font-semibold text-blush-500">
                    You save {formatPrice(Number(comparePrice) - product.price)}
                  </span>
                )}
              </div>

              <p className="text-pretty text-[0.9375rem] leading-relaxed text-muted">
                {product.description || "A little treat, picked for the way it feels in the hand."}
              </p>
            </div>

            <AddToCartButton product={product} />

            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Truck, label: "Tracked delivery across India" },
                { icon: ShieldCheck, label: "Secure Razorpay checkout" },
                { icon: PackageCheck, label: "Packed with care" },
                { icon: RotateCcw, label: "Easy 7-day support" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 rounded-3xl bg-surface/70 px-4 py-3 text-[0.8125rem] font-medium text-ink-700 hairline"
                >
                  <Icon className="h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.3} />
                  {label}
                </li>
              ))}
            </ul>

            <Accordion
              items={[
                {
                  title: "Description",
                  content: product.description || "Details for this piece are on their way.",
                },
                {
                  title: "Shipping",
                  content:
                    "Dispatched within 1-2 working days from India. Enter your PIN code at checkout to see live courier rates and delivery estimates, then track the parcel from your account once it leaves us.",
                },
                {
                  title: "Care & returns",
                  content:
                    "Hand wash or wipe clean where relevant. Something not right? Write to hello@shukarsh.com within 7 days of delivery and we will sort it out.",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={<ProductGridSkeleton count={4} className="section-shell pt-20" />}>
        <RelatedProducts categoryId={product.categoryId} excludeId={product.id} />
      </Suspense>
    </div>
  );
}
