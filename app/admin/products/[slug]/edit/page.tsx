"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "../../../../../components/AdminLayout";
import ProductForm, { FormData } from "../../../../../components/ProductForm";
import { useAuth } from "../../../../../lib/auth";
import { getCategories, getProduct, updateProduct } from "../../../../../lib/api";
import { Category, Product } from "../../../../../lib/types";

export default function EditProductPage() {
  const { slug } = useParams();
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || typeof slug !== "string") return;

    Promise.all([getProduct(slug).catch(() => null), getCategories()]).then(([productData, categoriesData]) => {
      setProduct(productData?.product || null);
      setCategories(categoriesData.categories);
      setLoading(false);
    });
  }, [slug]);

  const handleSubmit = async (form: FormData) => {
    if (!token || !product) throw new Error("Not authenticated");

    await updateProduct(token, product.id, {
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
      <h1 className="text-2xl font-bold text-zinc-900">Edit Product</h1>
      {loading ? (
        <p className="mt-4 text-zinc-600">Loading...</p>
      ) : product ? (
        <div className="mt-6">
          <ProductForm
            categories={categories}
            product={product}
            onSubmit={handleSubmit}
            submitLabel="Update Product"
          />
        </div>
      ) : (
        <p className="mt-4 text-zinc-600">Product not found.</p>
      )}
    </AdminLayout>
  );
}
