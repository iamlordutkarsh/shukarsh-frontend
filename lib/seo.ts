import type { Category, Product } from "./types";

/**
 * Where the shop lives, in one place.
 *
 * Guessing this wrong is worse than leaving it out: every canonical tag and
 * every sitemap entry would point Google at a host that is not the shop, which
 * is how a site ends up competing with itself. So it is read, never assumed.
 *
 * NEXT_PUBLIC_SITE_URL wins, because that is the custom domain once there is
 * one. Failing that, Vercel names the production deployment itself, which is
 * right often enough to be a sensible default and always right in the sense that
 * it points at this shop rather than somebody else's.
 */
const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const SITE_URL = (
  configured || (vercelDomain ? `https://${vercelDomain}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "Shukarsh";

export function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Share-card fields, built in one place.
 *
 * Next replaces an inherited `openGraph` object rather than merging into it, so a
 * page that sets a URL and nothing else silently drops the site name and locale
 * from the layout. Every page that needs any of it goes through here and gets all
 * of it.
 */
export function openGraphFor(fields: {
  path: string;
  title?: string;
  description?: string;
  images?: string[];
}) {
  const images = fields.images?.filter(Boolean) ?? [];

  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: "en_IN",
    url: fields.path,
    ...(fields.title ? { title: fields.title } : {}),
    ...(fields.description ? { description: fields.description } : {}),
    ...(images.length > 0 ? { images } : {}),
  };
}

/** Schema.org expects a string, and a rupee price has two decimal places. */
function amount(value: number): string {
  return value.toFixed(2);
}

/**
 * The structured data behind a product's search result: the price and whether it
 * is in stock, which is what turns a plain blue link into a listing with a figure
 * next to it.
 *
 * Deliberately not claiming a rating. There are no reviews yet, and inventing
 * stars is both a lie and the fastest way to lose every rich result on the
 * domain.
 *
 * Delivery and returns are left out too. Both are real policies, but the shipping
 * threshold lives in the backend config and reading it here would make every
 * product page render on demand, and schema.org has no category for "returns
 * accepted only if it arrived damaged", so any value would overstate or
 * understate what this shop actually offers.
 */
export function productJsonLd(product: Product): Record<string, unknown> {
  const url = absolute(`/products/${product.slug}`);
  const description = product.description?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(description ? { description } : {}),
    ...(product.images.length > 0 ? { image: product.images } : {}),
    // The short code the shop itself shows on the product page and in emails, so
    // a customer quoting it and a search engine indexing it mean the same thing.
    sku: product.id.slice(0, 8).toUpperCase(),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: amount(product.price),
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

/**
 * The trail shown under a search result instead of a bare URL. Mirrors the
 * breadcrumb already on the page, because markup that disagrees with what a
 * visitor can see is what gets a site penalised.
 */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/** Who the shop is, for the panel search engines build about a business. */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Small-batch kitchen finds, soft everyday clothing and salon-grade press-on nails, shipped across India.",
  };
}

/** Lets a search engine offer the shop's own search box in its results. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absolute("/products?search={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function collectionJsonLd(category: Category, products: Product[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    ...(category.description ? { description: category.description } : {}),
    url: absolute(`/categories/${category.slug}`),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(`/products/${product.slug}`),
        name: product.name,
      })),
    },
  };
}
