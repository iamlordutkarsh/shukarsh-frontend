import { ProductGridSkeleton, Skeleton } from "../../components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="section-shell py-16" role="status" aria-label="Loading products">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-6 w-32 rounded-full" />
        <Skeleton className="mx-auto h-12 w-80 max-w-full rounded-3xl" />
        <Skeleton className="mx-auto h-4 w-96 max-w-full rounded-full" />
      </div>
      <div className="mt-12 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <ProductGridSkeleton count={8} className="mt-8" />
    </div>
  );
}
