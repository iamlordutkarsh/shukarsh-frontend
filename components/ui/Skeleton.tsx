import { cn } from "../../lib/utils";

/** Shimmering placeholder block. Always pair with a matching final layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("shimmer-bg rounded-2xl", className)} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5 rounded-full", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-4xl bg-surface/70 p-3 shadow-soft">
      <Skeleton className="aspect-4/5 w-full rounded-3xl" />
      <div className="space-y-2.5 px-2 pb-1 pt-4">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4", className)}
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return <Skeleton className="aspect-4/5 w-full rounded-5xl" />;
}

export function CategoryGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading categories">
      {Array.from({ length: count }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </div>
  );
}
