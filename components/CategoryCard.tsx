import Link from "next/link";
import { Category } from "../lib/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const image = category.image || "https://placehold.co/400x400?text=Category";

  return (
    <Link href={`/categories/${category.slug}`} className="group relative block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={category.name}
        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 p-5">
        <h3 className="text-xl font-bold text-white">{category.name}</h3>
        {category.description && (
          <p className="mt-1 max-w-xs text-sm text-white/80 line-clamp-2">{category.description}</p>
        )}
        <span className="mt-3 inline-block text-sm font-semibold text-white/90 underline-offset-4 group-hover:underline">
          Shop now
        </span>
      </div>
    </Link>
  );
}
