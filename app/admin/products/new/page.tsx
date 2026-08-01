"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../../components/AdminLayout";
import ProductForm, { FormData } from "../../../../components/ProductForm";
import { ButtonLink } from "../../../../components/ui/Button";
import { Skeleton } from "../../../../components/ui/Skeleton";
import { useAuth } from "../../../../lib/auth";
import { createProduct, getCategories, updateVariants } from "../../../../lib/api";
import { cleanDetails, cleanSpecs } from "../../../../lib/product-content";
import { answersToPayload } from "../../../../components/admin/AttributeFields";
import { AttributeDefinition, Category } from "../../../../lib/types";

export default function NewProductPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (form: FormData, definitions: AttributeDefinition[]) => {
    if (!token) throw new Error("Not authenticated");

    const { product } = await createProduct(token, {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock),
      lowStockThreshold: Number(form.lowStockThreshold),
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
      // Half finished rows are dropped here rather than sent and rejected: the
      // API refuses a blank label, and one empty row would fail the whole save.
      specs: cleanSpecs(form.specs),
      details: cleanDetails(form.details),
      countryOfOrigin: form.countryOfOrigin.trim() || null,
      manufacturerName: form.manufacturerName.trim() || null,
      manufacturerAddr: form.manufacturerAddr.trim() || null,
      manufacturerPin: form.manufacturerPin.trim() || null,
      attributes: answersToPayload(definitions, form.attributes),
    });

    const colours = form.colours
      .filter((colour) => colour.name.trim())
      .map((colour) => ({ ...colour, name: colour.name.trim() }));
    const sizes = form.sizes.map((size) => size.trim()).filter(Boolean);

    if (colours.length === 0 && sizes.length === 0) return;

    /**
     * Saved as a second call, because options live on their own endpoint: they
     * carry stock and photos, which a product create has no business writing.
     *
     * The cells are the cross product of whichever axes were given. Either alone
     * is an ordinary product — colours with no sizes, or sizes with no colours —
     * so the missing axis contributes exactly one blank entry rather than none,
     * which would multiply the whole matrix away to nothing.
     */
    const colourNames: (string | null)[] = colours.length > 0 ? colours.map((c) => c.name) : [null];
    const labels = sizes.length > 0 ? sizes : [""];

    await updateVariants(token, product.id, {
      colours,
      variants: colourNames.flatMap((colourName) =>
        labels.map((label) => ({ colourName, label, isActive: true }))
      ),
    });

    // Splitting a product into options zeroes its total, so the next thing that
    // has to happen is counting each one in. That only exists on its own page.
    return `/admin/products/${product.slug}/edit`;
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
