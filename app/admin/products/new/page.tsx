"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../../components/AdminLayout";
import ProductForm, { FormData } from "../../../../components/ProductForm";
import { useAuth } from "../../../../lib/auth";
import { createProduct, getCategories } from "../../../../lib/api";
import { Category } from "../../../../lib/types";

export default function NewProductPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data.categories);
      setLoading(false);
    });
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
      images: form.images.split("\n").map((url) => url.trim()).filter(Boolean),
      categoryId: form.categoryId,
      isActive: form.isActive,
    });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Add Product</h1>
      {loading ? (
        <p className="mt-4 text-[var(--text-muted)]">Loading...</p>
      ) : (
        <div className="mt-6">
          <ProductForm categories={categories} onSubmit={handleSubmit} submitLabel="Create Product" />
        </div>
      )}
    </AdminLayout>
  );
}
