"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "../lib/types";
import { formatPrice } from "../lib/utils";
import { Button, ButtonLink } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { FormCard, FormField, inputClass, textareaClass } from "./admin/FormField";
import { ImageUploader } from "./admin/ImageUploader";

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
  images: string[];
  categoryId: string;
  isActive: boolean;
  weightKg: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  hsn: string;
  gstRate: string;
}

/** Matches the Prisma defaults so a blank field never blocks a save. */
const PARCEL_DEFAULTS = { weightKg: "0.5", lengthCm: "15", breadthCm: "12", heightCm: "6" };

/** The slabs GST actually uses. Same list the API validates against. */
const GST_RATES = ["0", "0.25", "3", "5", "12", "18", "28"];

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
    images: product?.images ?? [],
    categoryId: product?.categoryId || "",
    isActive: product?.isActive ?? true,
    weightKg: product?.weightKg != null ? String(product.weightKg) : PARCEL_DEFAULTS.weightKg,
    lengthCm: product?.lengthCm != null ? String(product.lengthCm) : PARCEL_DEFAULTS.lengthCm,
    breadthCm: product?.breadthCm != null ? String(product.breadthCm) : PARCEL_DEFAULTS.breadthCm,
    heightCm: product?.heightCm != null ? String(product.heightCm) : PARCEL_DEFAULTS.heightCm,
    hsn: product?.hsn || "",
    gstRate: product?.gstRate != null ? String(product.gstRate) : "5",
  });

  const priceNumber = Number(form.price);
  const pricePreview = form.price.trim() && Number.isFinite(priceNumber) ? formatPrice(priceNumber) : null;

  /** Price is the MRP, so show how much of it is already tax. */
  const gstInsidePrice = (() => {
    const rate = Number(form.gstRate);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) return null;
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return formatPrice(Math.round((priceNumber - priceNumber / (1 + rate / 100)) * 100) / 100);
  })();

  const volumetricKg = (() => {
    const volume = Number(form.lengthCm) * Number(form.breadthCm) * Number(form.heightCm);
    if (!Number.isFinite(volume) || volume <= 0) return null;
    return (volume / 5000).toFixed(2);
  })();

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

      <FormCard
        title="Shipping"
        description="Couriers price on the packed parcel, so measure the box you actually post."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Weight (kg)"
            htmlFor={`${uid}-weight`}
            hint={volumetricKg ? `Volumetric weight of this box is ${volumetricKg} kg.` : undefined}
          >
            <input
              id={`${uid}-weight`}
              required
              type="number"
              min="0.01"
              max="50"
              step="0.01"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="HSN code" htmlFor={`${uid}-hsn`} hint="Optional. Printed on the shipping invoice.">
            <input
              id={`${uid}-hsn`}
              value={form.hsn}
              onChange={(e) => setForm({ ...form, hsn: e.target.value })}
              placeholder="61091000"
              maxLength={10}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="GST rate"
            htmlFor={`${uid}-gst`}
            hint={
              gstInsidePrice
                ? `The price is inclusive, so ${gstInsidePrice} of it is GST.`
                : "The price you set is inclusive of this."
            }
          >
            <select
              id={`${uid}-gst`}
              value={form.gstRate}
              onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              className={inputClass}
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Length (cm)" htmlFor={`${uid}-length`}>
            <input
              id={`${uid}-length`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.lengthCm}
              onChange={(e) => setForm({ ...form, lengthCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Breadth (cm)" htmlFor={`${uid}-breadth`}>
            <input
              id={`${uid}-breadth`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.breadthCm}
              onChange={(e) => setForm({ ...form, breadthCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Height (cm)" htmlFor={`${uid}-height`}>
            <input
              id={`${uid}-height`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormCard>

      <FormCard title="Media" description="Upload photos or paste links. The first image becomes the cover.">
        <ImageUploader value={form.images} onChange={(images) => setForm({ ...form, images })} />
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
