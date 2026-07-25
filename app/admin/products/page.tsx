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
        <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Add Product
        </Link>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="mt-4 text-zinc-600">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{product.category.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-900">₹{product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{product.stock}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/products/${product.slug}/edit`}
                      className="mr-3 font-medium text-zinc-900 hover:underline"
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
