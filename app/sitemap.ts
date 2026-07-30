import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "../lib/api";
import { absolute } from "../lib/seo";
import type { Product } from "../lib/types";

/**
 * Cached, not built per request, so nobody can make the backend list the whole
 * catalogue on demand by refreshing this. The window is the catalogue's own
 * sixty seconds: a route is only ever as fresh as the shortest cache inside it,
 * so setting a longer one here would read as if it did something.
 *
 * If the API is down this returns the handful of pages that do not depend on it
 * rather than failing. A short sitemap is a bad day; a build that will not
 * finish is a worse one.
 */

/** The catalogue endpoint's own ceiling, so asking for more achieves nothing. */
const PAGE_SIZE = 50;

/**
 * A stop. The loop below trusts the API's page count, and a wrong one should cost
 * twenty requests rather than run until the build gives up.
 */
const MAX_PAGES = 20;

async function everyProduct(): Promise<Product[]> {
  const products: Product[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await getProducts({ page, limit: PAGE_SIZE }).catch(() => null);
    if (!result) break;

    products.push(...result.products);
    if (page >= result.pagination.pages) break;
  }

  return products;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories()
      .then((data) => data.categories)
      .catch(() => []),
    everyProduct(),
  ]);

  // A collection is as fresh as the newest thing in it, which is the honest
  // answer for a page that is only ever a list of its products.
  const categoryTouched = new Map<string, string>();
  for (const product of products) {
    const current = categoryTouched.get(product.categoryId);
    if (!current || product.updatedAt > current) {
      categoryTouched.set(product.categoryId, product.updatedAt);
    }
  }

  const newest = products.reduce<string | null>(
    (latest, product) => (!latest || product.updatedAt > latest ? product.updatedAt : latest),
    null
  );

  return [
    {
      url: absolute("/"),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absolute("/products"),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Rarely change, but they are the pages a shopper checks before trusting a
    // shop they have not bought from, so they are worth having indexed.
    ...["/contact", "/shipping", "/refunds", "/terms", "/privacy"].map((path) => ({
      url: absolute(path),
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    ...categories.map((category) => {
      const touched = categoryTouched.get(category.id);
      return {
        url: absolute(`/categories/${category.slug}`),
        ...(touched ? { lastModified: new Date(touched) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    }),
    ...products.map((product) => ({
      url: absolute(`/products/${product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
