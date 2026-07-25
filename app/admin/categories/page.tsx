"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../../../lib/api";
import { Category } from "../../../lib/types";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");

    try {
      if (editing) {
        await updateCategory(token, editing.id, form);
      } else {
        await createCategory(token, form);
      }
      setForm({ name: "", slug: "", description: "" });
      setEditing(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    if (!token) return;

    try {
      await deleteCategory(token, id);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "" });
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-zinc-900">Categories</h1>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">{editing ? "Edit Category" : "Add Category"}</h2>
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
            rows={3}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="mt-6 text-zinc-600">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Slug</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{category.slug}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleEdit(category)}
                      className="mr-3 font-medium text-zinc-900 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
