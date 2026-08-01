import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts, type ProductSort } from "../../lib/api";
import { openGraphFor } from "../../lib/seo";
import { FilterBar } from "../../components/catalog/FilterBar";
import { FacetPanel } from "../../components/catalog/FacetPanel";
import { Pagination } from "../../components/catalog/Pagination";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { RevealGroup, RevealItem } from "../../components/motion/Reveal";
import { ProductCard } from "../../components/product/ProductCard";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { NoResultsArt } from "../../components/ui/KawaiiArt";
import { ProductGridSkeleton, Skeleton } from "../../components/ui/Skeleton";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse every pastel kitchen, clothing and press-on nail find in the Shukarsh shop.",
  // Filters, sorts and pages all live on this URL as query strings, and each one
  // is the same catalogue in a different order. They point back here rather than
  // asking to be indexed as pages of their own.
  alternates: { canonical: "/products" },
  openGraph: openGraphFor({
    path: "/products",
    title: "Shop all",
    description: "Browse every pastel kitchen, clothing and press-on nail find in the Shukarsh shop.",
  }),
};

const sortKeys: ProductSort[] = ["newest", "oldest", "price-asc", "price-desc", "name"];

interface ProductsPageProps {
  // Filters arrive as `a[fabric]=Cotton`, so the shape is open rather than named.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The picked filters, read off the URL on the server.
 *
 * The same parsing the panel does in the browser, because the first render has
 * to fetch the already-narrowed catalogue rather than the whole one and then
 * correct itself.
 */
function readFacets(params: Record<string, string | string[] | undefined>): Record<string, string[]> {
  const selected: Record<string, string[]> = {};

  for (const [key, raw] of Object.entries(params)) {
    const match = /^a\[([a-z0-9-]+)\]$/.exec(key);
    if (!match || typeof raw !== "string") continue;

    const values = raw.split(",").map((entry) => entry.trim()).filter(Boolean);
    if (values.length > 0) selected[match[1]] = values;
  }

  return selected;
}

async function Catalog({
  categoryId,
  search,
  page,
  sort,
  facets,
}: {
  categoryId?: string;
  search?: string;
  page: number;
  sort: ProductSort;
  facets: Record<string, string[]>;
}) {
  const [categories, result] = await Promise.all([
    getCategories()
      // Only the departments belong in the chip row: the whole tree flattened
      // into it would be forty chips, which is a filter nobody scrolls.
      .then((data) => data.categories.filter((category) => !category.parentId))
      .catch(() => []),
    getProducts({ categoryId, search, page, sort, facets, limit: 12 }).catch(() => null),
  ]);

  if (!result) {
    return (
      <EmptyState
        art={<NoResultsArt />}
        title="The shop is catching its breath"
        description="We could not reach the catalogue just now. Give it a few seconds and refresh."
        action={<ButtonLink href="/products">Try again</ButtonLink>}
      />
    );
  }

  const { products, pagination } = result;

  // Defaulted, not assumed. An API that has not been redeployed yet, or a
  // response cached from before facets existed, has no such key — and reading
  // .length off it took the whole shop page down rather than dropping one panel.
  const available = result.facets ?? [];

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (search) params.set("search", search);
    if (sort !== "newest") params.set("sort", sort);
    // Carried through, or page two drops back to the unfiltered catalogue.
    for (const [key, values] of Object.entries(facets)) {
      if (values.length > 0) params.set(`a[${key}]`, values.join(","));
    }
    if (target > 1) params.set("page", target.toString());
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  return (
    <>
      <FilterBar
        categories={categories}
        activeCategoryId={categoryId}
        activeSort={sort}
        search={search}
        total={pagination.total}
      />

      {available.length > 0 && (
        <div className="mt-6">
          <FacetPanel facets={available} />
        </div>
      )}

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            art={<NoResultsArt />}
            title="Nothing matched that"
            description={
              search
                ? `We could not find anything for “${search}”. Try a shorter word or browse everything.`
                : "This collection is being restocked. Have a peek at the rest of the shop."
            }
            action={<ButtonLink href="/products">Browse everything</ButtonLink>}
          />
        ) : (
          <>
            <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" stagger={0.05}>
              {products.map((product, index) => (
                <RevealItem key={product.id} className="h-full">
                  <ProductCard product={product} priority={index < 4} />
                </RevealItem>
              ))}
            </RevealGroup>

            <Pagination page={pagination.page} pages={pagination.pages} buildHref={buildPageHref} />
          </>
        )}
      </div>
    </>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  // A repeated parameter arrives as an array. Nothing here means one twice, so
  // the first is taken rather than the request being refused over a stray link.
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  const categoryId = one(params.categoryId);
  const search = one(params.search);
  const page = Math.max(1, Number(one(params.page)) || 1);
  const sortParam = one(params.sort);
  const sort = sortKeys.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";
  const facets = readFacets(params);

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[28rem] opacity-70" />

      <div className="section-shell relative">
        <header className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-lavender-100/80 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-lavender-700">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-blush-400" />
            The whole shop
          </span>
          <h1 className="mt-4 text-hero text-balance">Everything, in one pastel place</h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">
            Filter by collection, sort how you like, and hover anything for a closer look.
          </p>
        </header>

        <div className="mt-12">
          <Suspense
            key={`${categoryId ?? ""}-${search ?? ""}-${page}-${sort}-${JSON.stringify(facets)}`}
            fallback={
              <>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-28 rounded-full" />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-11 w-56 rounded-full" />
                  </div>
                </div>
                <ProductGridSkeleton count={8} className="mt-8" />
              </>
            }
          >
            <Catalog
              categoryId={categoryId}
              search={search}
              page={page}
              sort={sort}
              facets={facets}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
