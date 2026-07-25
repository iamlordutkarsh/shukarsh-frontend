import Link from "next/link";
import { Category } from "../lib/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const image = category.image || "https://placehold.co/400x400?text=Category";

  return (
    <Link href={`/categories/${category.slug}`} className="group relative block overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={category.name}
        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="text-lg font-bold text-white">{category.name}</h3>
        {category.description && (
          <p className="mt-1 text-sm text-white/80">{category.description}</p>
        )}
      </div>
    </Link>
  );
}
