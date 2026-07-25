import { ProductGridSkeleton, Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="section-shell py-16" role="status" aria-label="Loading page">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-14 w-3/4 max-w-2xl rounded-3xl" />
        <Skeleton className="h-4 w-full max-w-md rounded-full" />
      </div>
      <ProductGridSkeleton count={8} className="mt-14" />
    </div>
  );
}
