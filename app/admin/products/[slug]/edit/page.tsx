"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminLayout from "../../../../../components/AdminLayout";
import ProductForm, { FormData } from "../../../../../components/ProductForm";
import { ButtonLink } from "../../../../../components/ui/Button";
import { EmptyState } from "../../../../../components/ui/EmptyState";
import { OopsArt } from "../../../../../components/ui/KawaiiArt";
import { Skeleton } from "../../../../../components/ui/Skeleton";
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
    // Waiting for the token matters: an anonymous read comes back without the
    // cost price, and the form would then save that blank over the real one.
    if (!token) return;

    Promise.all([getProduct(slug, token).catch(() => null), getCategories()]).then(
      ([productData, categoriesData]) => {
        setProduct(productData?.product || null);
        setCategories(categoriesData.categories);
        setLoading(false);
      }
    );
  }, [slug, token]);

  const handleSubmit = async (form: FormData) => {
    if (!token || !product) throw new Error("Not authenticated");

    await updateProduct(token, product.id, {
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
      gstRate: Number(form.gstRate),
      // Blank means "not recorded", which is a null rather than a zero cost.
      costPrice: form.costPrice.trim() ? Number(form.costPrice) : null,
    });
  };

  return (
    <AdminLayout
      title="Edit product"
      subtitle={product ? product.name : "Tweak the details of an existing piece."}
      actions={
        <ButtonLink href="/admin/products" variant="secondary">
          All products
        </ButtonLink>
      }
    >
      {loading ? (
        <div className="max-w-3xl space-y-5" role="status" aria-label="Loading product">
          <Skeleton className="h-64 w-full rounded-4xl" />
          <Skeleton className="h-40 w-full rounded-4xl" />
          <Skeleton className="h-40 w-full rounded-4xl" />
        </div>
      ) : product ? (
        <ProductForm
          categories={categories}
          product={product}
          onSubmit={handleSubmit}
          submitLabel="Update product"
        />
      ) : (
        <EmptyState
          art={<OopsArt />}
          title="We could not find that product"
          description="It may have been deleted or the link changed."
          action={<ButtonLink href="/admin/products">Back to products</ButtonLink>}
        />
      )}
    </AdminLayout>
  );
}
