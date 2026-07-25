"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "../lib/types";

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

export default function ProductForm({ categories, product, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(form);
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-zinc-900">Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900">Slug</label>
        <input
          required
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-900">Price (₹)</label>
          <input
            required
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-900">Compare Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={form.comparePrice}
            onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-900">Stock</label>
          <input
            required
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-900">Category</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-900">Images (one URL per line)</label>
        <textarea
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          className="rounded border-zinc-300"
        />
        <label className="text-sm text-zinc-900">Active</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
