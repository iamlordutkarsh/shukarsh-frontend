import type { Metadata } from "next";
import { Suspense } from "react";
import { FeaturedCollections } from "../components/home/FeaturedCollections";
import { Hero } from "../components/home/Hero";
import { InstagramStrip } from "../components/home/InstagramStrip";
import { NewArrivals } from "../components/home/NewArrivals";
import { PromoBanner } from "../components/home/PromoBanner";
import { Testimonials } from "../components/home/Testimonials";
import { ValueProps } from "../components/home/ValueProps";
import { CategoryGridSkeleton, ProductGridSkeleton, Skeleton } from "../components/ui/Skeleton";
import { openGraphFor } from "../lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: openGraphFor({ path: "/" }),
};

function SectionFallback({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-shell py-8 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-6 w-28 rounded-full" />
        <Skeleton className="mx-auto h-9 w-72 rounded-full" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full rounded-full" />
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />

      <Suspense
        fallback={
          <SectionFallback>
            <CategoryGridSkeleton />
          </SectionFallback>
        }
      >
        <FeaturedCollections />
      </Suspense>

      <Suspense
        fallback={
          <SectionFallback>
            <ProductGridSkeleton count={8} />
          </SectionFallback>
        }
      >
        <NewArrivals />
      </Suspense>

      <PromoBanner />
      <Testimonials />
      <InstagramStrip />
    </>
  );
}
