"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "../lib/types";
import { formatPrice } from "../lib/utils";
import { Button, ButtonLink } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { FormCard, FormField, inputClass, textareaClass } from "./admin/FormField";

interface ProductFormProps {
  categories: Category[];
  product?: Product;
  onSubmit: (data: FormData) => Promise<void>;
  submitLabel: string;
}

export interface FormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  images: string;
  categoryId: string;
  isActive: boolean;
}

function parseImageUrls(value: string) {
  return value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

export default function ProductForm({ categories, product, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const uid = useId();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price ? String(product.price) : "",
    comparePrice: product?.comparePrice ? String(product.comparePrice) : "",
    stock: product?.stock ? String(product.stock) : "",
    images: product?.images?.join("\n") || "",
    categoryId: product?.categoryId || "",
    isActive: product?.isActive ?? true,
  });

  const priceNumber = Number(form.price);
  const pricePreview = form.price.trim() && Number.isFinite(priceNumber) ? formatPrice(priceNumber) : null;
  const imageCount = parseImageUrls(form.images).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(form);
      toast({
        title: submitLabel.startsWith("Create") ? "Product created" : "Product updated",
        description: `${form.name} is live in the catalogue.`,
        tone: "success",
      });
      router.push("/admin/products");
    } catch (err) {
      toast({
        title: "Could not save product",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <FormCard title="The basics" description="Name and slug shape how shoppers find this piece.">
        <FormField label="Name" htmlFor={`${uid}-name`}>
          <input
            id={`${uid}-name`}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Cloud Bunny Tote"
            className={inputClass}
          />
        </FormField>

        <FormField label="Slug" htmlFor={`${uid}-slug`} hint="Lowercase words joined by hyphens, e.g. cloud-bunny-tote.">
          <input
            id={`${uid}-slug`}
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="cloud-bunny-tote"
            className={inputClass}
          />
        </FormField>

        <FormField label="Description" htmlFor={`${uid}-description`}>
          <textarea
            id={`${uid}-description`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Tell the little story behind this piece..."
            className={textareaClass}
          />
        </FormField>
      </FormCard>

      <FormCard title="Pricing" description="Compare price is optional and renders as a strike-through.">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Price" htmlFor={`${uid}-price`} hint={pricePreview ? `Shows as ${pricePreview}` : undefined}>
            <input
              id={`${uid}-price`}
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Compare price" htmlFor={`${uid}-compare-price`}>
            <input
              id={`${uid}-compare-price`}
              type="number"
              min="0"
              step="0.01"
              value={form.comparePrice}
              onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormCard>

      <FormCard title="Inventory" description="Stock and shelf placement.">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Stock" htmlFor={`${uid}-stock`}>
            <input
              id={`${uid}-stock`}
              required
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Category" htmlFor={`${uid}-category`}>
            <select
              id={`${uid}-category`}
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-surface-soft px-4 py-3.5">
          <input
            id={`${uid}-active`}
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded-md"
          />
          <span>
            <label htmlFor={`${uid}-active`} className="block text-sm font-semibold text-ink">
              Active
            </label>
            <span className="mt-0.5 block text-xs text-muted">Inactive products stay hidden from the storefront.</span>
          </span>
        </div>
      </FormCard>

      <FormCard title="Media" description="One image URL per line. The first one becomes the cover.">
        <FormField
          label="Image URLs"
          htmlFor={`${uid}-images`}
          hint={imageCount > 0 ? `${imageCount} image${imageCount === 1 ? "" : "s"} ready` : "No images yet."}
        >
          <textarea
            id={`${uid}-images`}
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            rows={4}
            placeholder={"https://images.unsplash.com/photo-1\nhttps://images.unsplash.com/photo-2"}
            className={`${textareaClass} font-mono text-xs`}
          />
        </FormField>
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <ButtonLink href="/admin/products" variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
