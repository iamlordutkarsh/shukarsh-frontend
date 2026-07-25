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
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Categories</h1>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{editing ? "Edit Category" : "Add Category"}</h2>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Slug</label>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="mt-1 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]"
          >
            {editing ? "Update" : "Create"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="mt-6 text-[var(--text-muted)]">Loading...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Slug</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">{category.slug}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <button
                      onClick={() => handleEdit(category)}
                      className="mr-3 font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
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
