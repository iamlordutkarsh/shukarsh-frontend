"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import { deleteProduct, getProducts } from "../../../lib/api";
import { Product } from "../../../lib/types";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts({ limit: 100 });
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    if (!token) return;

    try {
      await deleteProduct(token, id);
      setProducts((current) => current.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]"
        >
          Add Product
        </Link>
      </div>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="mt-4 text-[var(--text-muted)]">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{product.category.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">₹{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{product.stock}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/products/${product.slug}/edit`}
                      className="mr-3 font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
