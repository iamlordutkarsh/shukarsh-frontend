"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { ChevronRight, ListChecks, Pencil, Tags, Trash2 } from "lucide-react";
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
import { cn } from "../../../lib/utils";
import { AttributeEditor } from "../../../components/admin/AttributeEditor";

const emptyForm = { name: "", slug: "", description: "", parentId: "", position: "0" };

/**
 * The tree flattened back out, with a depth against each row.
 *
 * A nested list would need a recursive component to render and a recursive walk
 * to find anything; one flat list indented by depth draws the same shape and
 * stays an ordinary array. Roots first, each followed by its own subtree, which
 * is the order somebody reads a menu in.
 */
function flatten(categories: Category[], parentId: string | null = null, depth = 0): { category: Category; depth: number }[] {
  return categories
    .filter((category) => (category.parentId ?? null) === parentId)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .flatMap((category) => [
      { category, depth },
      ...flatten(categories, category.id, depth + 1),
    ]);
}

/** Every category at or below this one, so a parent picker can rule them out. */
function subtreeIds(categories: Category[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;

  // Repeated passes rather than recursion: the list is small, and this cannot
  // loop forever on a parent chain that somehow points back at itself.
  while (grew) {
    grew = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        grew = true;
      }
    }
  }

  return ids;
}

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
  const [questionsFor, setQuestionsFor] = useState<Category | null>(null);
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
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        // Empty means the top level, which the API takes as an explicit null
        // rather than an absent field: "no parent" and "leave it alone" are
        // different instructions.
        parentId: form.parentId || null,
        position: Number(form.position) || 0,
      };

      if (editing) {
        await updateCategory(token, editing.id, payload);
      } else {
        await createCategory(token, payload);
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
      parentId: category.parentId || "",
      position: String(category.position ?? 0),
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

            <FormField
              label="Sits inside"
              htmlFor={`${uid}-parent`}
              hint="Leave at the top level for a department. Questions asked here are asked of everything beneath it."
            >
              <select
                id={`${uid}-parent`}
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className={inputClass}
              >
                <option value="">Top level</option>
                {flatten(categories)
                  // A category cannot sit inside itself or anything below it:
                  // that makes a ring which never reaches a root, and every
                  // category in it drops out of the menu. The API refuses it too.
                  .filter(({ category }) => !editing || !subtreeIds(categories, editing.id).has(category.id))
                  .map(({ category, depth }) => (
                    <option key={category.id} value={category.id}>
                      {`${"— ".repeat(depth)}${category.name}`}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField
              label="Position"
              htmlFor={`${uid}-position`}
              hint="Order among its siblings. Lower comes first."
            >
              <input
                id={`${uid}-position`}
                type="number"
                min={0}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
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
            <ul className="overflow-hidden rounded-4xl bg-surface/90 shadow-soft hairline">
              {flatten(categories).map(({ category, depth }) => {
                const active = editing?.id === category.id;
                const isLeaf = !categories.some((child) => child.parentId === category.id);

                return (
                  <li
                    key={category.id}
                    className={cn(
                      "flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 last:border-b-0",
                      active && "bg-lavender-50"
                    )}
                    // Indented by depth so the shape of the tree is the shape of
                    // the list. A nested list would need a recursive component
                    // to draw exactly this.
                    style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
                  >
                    {depth > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={2.4} aria-hidden />
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{category.name}</span>
                      <span className="block truncate text-xs text-muted">{category.slug}</span>
                    </span>

                    {isLeaf && <Pill tone="glass">Products go here</Pill>}

                    <span className="flex shrink-0 items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuestionsFor(category)}
                      >
                        <ListChecks className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Questions
                      </Button>
                      <Button
                        variant="ghost"
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
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={questionsFor !== null}
        onClose={() => setQuestionsFor(null)}
        label={`Questions for ${questionsFor?.name ?? ""}`}
        className="max-w-2xl"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
          <h2 className="pr-12 text-xl text-ink">{questionsFor?.name}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            What every product filed here, or anywhere beneath here, is asked for. These become the
            fields on the product form, and the filters on the catalogue.
          </p>

          <div className="mt-6">
            {questionsFor && (
              <AttributeEditor
                // Remounted per category, so opening a second one starts from
                // its own questions rather than the last one's.
                key={questionsFor.id}
                categoryId={questionsFor.id}
                categoryName={questionsFor.name}
              />
            )}
          </div>
        </div>
      </Modal>

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
