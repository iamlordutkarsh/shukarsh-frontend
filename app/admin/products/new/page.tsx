"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../../components/AdminLayout";
import ProductForm, { FormData } from "../../../../components/ProductForm";
import { ButtonLink } from "../../../../components/ui/Button";
import { Skeleton } from "../../../../components/ui/Skeleton";
import { useAuth } from "../../../../lib/auth";
import { createProduct, getCategories } from "../../../../lib/api";
import { Category } from "../../../../lib/types";

export default function NewProductPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (form: FormData) => {
    if (!token) throw new Error("Not authenticated");

    await createProduct(token, {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock),
      images: form.images,
      categoryId: form.categoryId,
      isActive: form.isActive,
      weightKg: Number(form.weightKg),
      lengthCm: Number(form.lengthCm),
      breadthCm: Number(form.breadthCm),
      heightCm: Number(form.heightCm),
      hsn: form.hsn.trim(),
    });
  };

  return (
    <AdminLayout
      title="Add product"
      subtitle="A new piece for the shelf. Everything can be edited later."
      actions={
        <ButtonLink href="/admin/products" variant="secondary">
          All products
        </ButtonLink>
      }
    >
      {loading ? (
        <div className="max-w-3xl space-y-5" role="status" aria-label="Loading product form">
          <Skeleton className="h-64 w-full rounded-4xl" />
          <Skeleton className="h-40 w-full rounded-4xl" />
          <Skeleton className="h-40 w-full rounded-4xl" />
        </div>
      ) : (
        <ProductForm categories={categories} onSubmit={handleSubmit} submitLabel="Create product" />
      )}
    </AdminLayout>
  );
}
