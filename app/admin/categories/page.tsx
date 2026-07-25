"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Pencil, Tags, Trash2 } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { FormField, inputClass, textareaClass } from "../../../components/admin/FormField";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Modal } from "../../../components/ui/Modal";
import { Pill } from "../../../components/ui/Pill";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { Category } from "../../../lib/types";

const emptyForm = { name: "", slug: "", description: "" };

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const uid = useId();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await getCategories();
        if (active) setCategories(data.categories);
      } catch (err) {
        if (active) {
          toast({
            title: "Could not load categories",
            description: err instanceof Error ? err.message : "Please try again in a moment.",
            tone: "error",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [reloadKey, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: "Session expired", description: "Sign in again to manage categories.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(token, editing.id, form);
      } else {
        await createCategory(token, form);
      }
      toast({
        title: editing ? "Category updated" : "Category created",
        description: `${form.name} is ready to use.`,
        tone: "success",
      });
      setForm(emptyForm);
      setEditing(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not save category",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setSaving(false);
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

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (!token) {
      toast({ title: "Session expired", description: "Sign in again to delete categories.", tone: "error" });
      return;
    }

    setDeleting(true);
    try {
      await deleteCategory(token, pendingDelete.id);
      toast({ title: "Category deleted", description: `${pendingDelete.name} is gone.`, tone: "success" });
      if (editing?.id === pendingDelete.id) handleCancel();
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not delete category",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Categories" subtitle="The shelves of the shop. Keep names short and slugs tidy.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6 lg:sticky lg:top-28"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-lavender-100 text-lavender-700">
              <Tags className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <h2 className="text-lg text-ink">{editing ? "Edit category" : "New category"}</h2>
          </div>

          <div className="mt-5 space-y-5">
            <FormField label="Name" htmlFor={`${uid}-name`}>
              <input
                id={`${uid}-name`}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Plushies"
                className={inputClass}
              />
            </FormField>

            <FormField label="Slug" htmlFor={`${uid}-slug`} hint="Used in the URL, e.g. /categories/plushies.">
              <input
                id={`${uid}-slug`}
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="plushies"
                className={inputClass}
              />
            </FormField>

            <FormField label="Description" htmlFor={`${uid}-description`}>
              <textarea
                id={`${uid}-description`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Soft, squishy and endlessly huggable."
                className={textareaClass}
              />
            </FormField>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create category"}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading categories">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36 w-full rounded-4xl" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              art={<NoResultsArt />}
              title="No categories yet"
              description="Create your first shelf using the form beside this card."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const active = editing?.id === category.id;
                return (
                  <li
                    key={category.id}
                    className={
                      active
                        ? "rounded-4xl bg-surface p-5 shadow-lift ring-2 ring-lavender-300"
                        : "rounded-4xl bg-surface/90 p-5 shadow-soft hairline"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base text-ink">{category.name}</h3>
                        <div className="mt-2">
                          <Pill tone="glass">{category.slug}</Pill>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => setPendingDelete(category)}
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </Button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{category.description}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        label="Confirm category deletion"
        className="max-w-md"
      >
        <div className="p-7 sm:p-8">
          <h2 className="pr-10 text-xl text-ink">Delete this category?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {pendingDelete?.name} will be removed. Products pointing at it may need a new shelf.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="dark" loading={deleting} onClick={confirmDelete}>
              Delete category
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
