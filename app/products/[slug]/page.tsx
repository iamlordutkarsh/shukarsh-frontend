import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Suspense } from "react";
import { getProduct, getProducts, getReviews } from "../../../lib/api";
import { discountPercent, formatPrice } from "../../../lib/utils";
import { isLowStock } from "../../../lib/inventory";
import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { Reveal, RevealGroup, RevealItem } from "../../../components/motion/Reveal";
import { AddToCartButton } from "../../../components/product/AddToCartButton";
import { ShareButton } from "../../../components/product/ShareButton";
import { DeliveryCheck } from "../../../components/product/DeliveryCheck";
import { ProductCard } from "../../../components/product/ProductCard";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { ReviewForm } from "../../../components/product/ReviewForm";
import { ReviewList } from "../../../components/product/ReviewList";
import { RatingLine } from "../../../components/product/Stars";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd, openGraphFor, productJsonLd } from "../../../lib/seo";
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

  const description = product.description?.slice(0, 160) ?? `Shop ${product.name} at Shukarsh.`;
  const path = `/products/${product.slug}`;

  return {
    title: product.name,
    description,
    // A product is reachable from a category, a search and a share link, so it
    // needs to name the one address that counts or the same page competes with
    // itself in the index.
    alternates: { canonical: path },
    openGraph: openGraphFor({
      path,
      title: product.name,
      description,
      images: product.images.slice(0, 1),
    }),
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

async function Reviews({ productId, productName }: { productId: string; productName: string }) {
  // An outage in the reviews endpoint must not take the product page with it.
  // Somebody trying to buy something cares about the buy button, not the
  // opinions underneath it.
  const data = await getReviews(productId, { limit: 10 }).catch(() => ({
    reviews: [],
    summary: { count: 0, average: null },
  }));

  return (
    <section className="section-shell pt-20">
      <Reveal>
        <ReviewList reviews={data.reviews} summary={data.summary} />
      </Reveal>
      {/* The anchor sits on this wrapper rather than inside the form, because
          the form only appears once the browser has asked whether this shopper
          is eligible. A link arriving at #write-review has to find something in
          the server-rendered HTML or it lands at the top of the page and looks
          like a dead link. */}
      <div id="write-review" className="scroll-mt-28">
        <ReviewForm productId={productId} productName={productName} />
      </div>
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
  const runningLow = isLowStock(product);

  // Only what this product actually carries. A spec table full of "—" reads as
  // missing data rather than detail, so blank fields are dropped entirely.
  const dimensions = [product.lengthCm, product.breadthCm, product.heightCm].every(Boolean)
    ? `${product.lengthCm} × ${product.breadthCm} × ${product.heightCm} cm`
    : null;

  const specs = [
    { label: "Category", value: product.category.name },
    // Short and stable, like an order number. Slicing the slug produced codes
    // cut off mid-word, which reads as a bug rather than an identifier.
    { label: "Item code", value: product.id.slice(0, 8).toUpperCase() },
    dimensions ? { label: "Dimensions", value: dimensions } : null,
    product.weightKg ? { label: "Weight", value: `${product.weightKg} kg` } : null,
    { label: "Availability", value: soldOut ? "Out of stock" : `${product.stock} in stock` },
    product.hsn ? { label: "HSN", value: product.hsn } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="relative pb-20 pt-8">
      <JsonLd
        data={[
          productJsonLd(product),
          // The same trail the visitor can see below, in the same order.
          breadcrumbJsonLd([
            { name: "Shop", path: "/products" },
            { name: product.category.name, path: `/categories/${product.category.slug}` },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
        ]}
      />

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
                {!soldOut && runningLow && <Pill tone="peach">Only {product.stock} left</Pill>}
                {!soldOut && !runningLow && <Pill tone="mint">In stock</Pill>}
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-hero text-balance">{product.name}</h1>
                <ShareButton name={product.name} />
              </div>

              {/* Absent rating means this response did not count them, which is
                  not the same as nobody having reviewed, so nothing is drawn
                  either way until there is a real number to draw. */}
              {product.rating && product.rating.count > 0 && product.rating.average != null && (
                <a href="#reviews" className="inline-flex w-fit rounded-full transition-opacity hover:opacity-70">
                  <RatingLine average={product.rating.average} count={product.rating.count} />
                </a>
              )}

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

              <p className="text-xs text-faint">Inclusive of all taxes</p>

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

            <DeliveryCheck productId={product.id} />

            <Accordion
              items={[
                {
                  title: "Product details",
                  content: (
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      {specs.map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-3 border-b border-line pb-2">
                          <dt className="text-muted">{label}</dt>
                          <dd className="text-right font-semibold text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                {
                  title: "Delivery",
                  content:
                    "Free on every order, dispatched within 1-2 working days from India. Enter your PIN code above for a delivery estimate, then track the parcel from your account once it leaves us.",
                },
                {
                  title: "Care & returns",
                  content:
                    "Hand wash or wipe clean where relevant. If it arrives damaged or we sent the wrong thing, open a return from your order within 7 days of delivery and we will collect it and put it right.",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <Reviews productId={product.id} productName={product.name} />

      <Suspense fallback={<ProductGridSkeleton count={4} className="section-shell pt-20" />}>
        <RelatedProducts categoryId={product.categoryId} excludeId={product.id} />
      </Suspense>
    </div>
  );
}
