"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { BadgePercent, Pencil, Power, Trash2, X } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { FormField, inputClass, labelClass } from "../../../components/admin/FormField";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Modal } from "../../../components/ui/Modal";
import { Pill } from "../../../components/ui/Pill";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import {
  createCoupon,
  deleteCoupon,
  getCategories,
  getCoupons,
  getProducts,
  updateCoupon,
} from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { Category, Coupon, CouponType, Product } from "../../../lib/types";
import { useClickOutside } from "../../../lib/use-click-outside";
import { cn, formatPrice } from "../../../lib/utils";

const emptyForm = {
  code: "",
  description: "",
  type: "PERCENT" as CouponType,
  value: "10",
  maxDiscount: "",
  minOrderValue: "",
  usageLimit: "",
  perUserLimit: "1",
  firstOrderOnly: false,
  startsAt: "",
  expiresAt: "",
  isActive: true,
  categoryIds: [] as string[],
  products: [] as { id: string; name: string }[],
};

type FormState = typeof emptyForm;

const TYPE_LABELS: Record<CouponType, string> = {
  PERCENT: "Percent off",
  FLAT: "Flat amount off",
  FREE_SHIPPING: "Free shipping",
};

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function describe(coupon: Coupon): string {
  if (coupon.type === "FREE_SHIPPING") return "Free shipping";
  if (coupon.type === "FLAT") return `${formatPrice(coupon.value)} off`;
  const cap = coupon.maxDiscount ? ` up to ${formatPrice(coupon.maxDiscount)}` : "";
  return `${coupon.value}% off${cap}`;
}

/** Why a code would be turned away right now, or null if it is good to go. */
function inactiveReason(coupon: Coupon): string | null {
  if (!coupon.isActive) return "Switched off";
  const now = Date.now();
  if (coupon.startsAt && now < new Date(coupon.startsAt).getTime()) return "Not live yet";
  if (coupon.expiresAt && now > new Date(coupon.expiresAt).getTime()) return "Expired";
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return "Fully claimed";
  return null;
}

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const uid = useId();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const productSearchRef = useRef<HTMLDivElement>(null);

  // The results float over the checkboxes below them, so clicking away has to
  // put them back rather than leaving them parked on top.
  const closeProductResults = useCallback(() => setProductResults([]), []);
  useClickOutside(productSearchRef, closeProductResults, productResults.length > 0);

  /** Search the catalogue rather than listing it, since it only grows. */
  useEffect(() => {
    const term = productQuery.trim();
    let active = true;

    const timer = setTimeout(() => {
      if (term.length < 2) {
        if (active) setProductResults([]);
        return;
      }

      getProducts({ search: term, limit: 8 })
        .then((data) => {
          if (active) setProductResults(data.products);
        })
        .catch(() => {
          if (active) setProductResults([]);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productQuery]);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    if (!token) return;
    let active = true;

    void (async () => {
      try {
        const [couponData, categoryData] = await Promise.all([getCoupons(token), getCategories()]);
        if (!active) return;
        setCoupons(couponData.coupons);
        setCategories(categoryData.categories);
      } catch (err) {
        if (active) {
          toast({
            title: "Could not load coupons",
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
  }, [reloadKey, token, toast]);

  const payload = useMemo(
    () => ({
      code: form.code.trim().toUpperCase(),
      // null, not undefined: JSON.stringify drops undefined, so the PUT would
      // not carry the key at all and a cleared field would keep its old value.
      description: form.description.trim() || null,
      type: form.type,
      value: form.type === "FREE_SHIPPING" ? 0 : Number(form.value || 0),
      // A cap only means anything on a percent code, and the field is hidden for
      // the others, so a leftover value must not travel with them.
      maxDiscount: form.type === "PERCENT" && form.maxDiscount ? Number(form.maxDiscount) : null,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      // Blank means no limit, which the API models as null rather than absent.
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      firstOrderOnly: form.firstOrderOnly,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
      categoryIds: form.categoryIds,
      productIds: form.products.map((product) => product.id),
    }),
    [form]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: "Session expired", description: "Sign in again to manage coupons.", tone: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCoupon(token, editing.id, payload);
      } else {
        await createCoupon(token, payload);
      }
      toast({
        title: editing ? "Coupon updated" : "Coupon created",
        description: `${payload.code} is ready to use.`,
        tone: "success",
      });
      setForm(emptyForm);
      setEditing(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not save coupon",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: String(coupon.value),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit != null ? String(coupon.perUserLimit) : "",
      firstOrderOnly: coupon.firstOrderOnly,
      startsAt: toLocalInput(coupon.startsAt),
      expiresAt: toLocalInput(coupon.expiresAt),
      isActive: coupon.isActive,
      categoryIds: coupon.categoryIds,
      products: coupon.products,
    });
    setProductQuery("");
    setProductResults([]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || !token) return;

    setDeleting(true);
    try {
      const result = await deleteCoupon(token, pendingDelete.id);
      toast({
        title: result.deactivated ? "Coupon switched off" : "Coupon deleted",
        description:
          result.message ?? `${pendingDelete.code} will not be accepted at checkout any more.`,
        tone: "success",
      });
      if (editing?.id === pendingDelete.id) handleCancel();
      setPendingDelete(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not remove coupon",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const addProduct = (product: { id: string; name: string }) => {
    setForm((current) =>
      current.products.some((existing) => existing.id === product.id)
        ? current
        : { ...current, products: [...current.products, { id: product.id, name: product.name }] }
    );
    setProductQuery("");
    setProductResults([]);
  };

  const removeProduct = (id: string) => {
    setForm((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== id),
    }));
  };

  const toggleCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((value) => value !== id)
        : [...current.categoryIds, id],
    }));
  };

  return (
    <AdminLayout
      title="Coupons"
      subtitle="Launch offers, influencer codes and free delivery. Every code is checked against the real bag before it counts."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-6">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6 lg:sticky lg:top-28"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-lavender-100 text-lavender-700">
              <BadgePercent className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <h2 className="text-lg text-ink">{editing ? `Edit ${editing.code}` : "New coupon"}</h2>
          </div>

          <div className="mt-5 space-y-5">
            <FormField label="Code" htmlFor={`${uid}-code`} hint="What the customer types. Case does not matter.">
              <input
                id={`${uid}-code`}
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                maxLength={40}
                className={cn(inputClass, "font-semibold uppercase tracking-wide")}
              />
            </FormField>

            <FormField label="Type" htmlFor={`${uid}-type`}>
              <select
                id={`${uid}-type`}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
                className={inputClass}
              >
                {(Object.keys(TYPE_LABELS) as CouponType[]).map((type) => (
                  <option key={type} value={type}>
                    {TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FormField>

            {form.type !== "FREE_SHIPPING" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label={form.type === "PERCENT" ? "Percent off" : "Amount off"}
                  htmlFor={`${uid}-value`}
                >
                  <input
                    id={`${uid}-value`}
                    required
                    type="number"
                    min="1"
                    max={form.type === "PERCENT" ? "100" : undefined}
                    step={form.type === "PERCENT" ? "1" : "0.01"}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className={inputClass}
                  />
                </FormField>

                {form.type === "PERCENT" && (
                  <FormField label="Cap the discount" htmlFor={`${uid}-cap`} hint="Optional.">
                    <input
                      id={`${uid}-cap`}
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      placeholder="500"
                      className={inputClass}
                    />
                  </FormField>
                )}
              </div>
            )}

            <FormField
              label="Minimum spend"
              htmlFor={`${uid}-min`}
              hint="Checked against the items this code covers, not the whole bag."
            >
              <input
                id={`${uid}-min`}
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="0"
                className={inputClass}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Total uses" htmlFor={`${uid}-limit`} hint="Blank for unlimited.">
                <input
                  id={`${uid}-limit`}
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="∞"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Uses per customer" htmlFor={`${uid}-per-user`} hint="Blank for unlimited.">
                <input
                  id={`${uid}-per-user`}
                  type="number"
                  min="1"
                  value={form.perUserLimit}
                  onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                  placeholder="∞"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Starts" htmlFor={`${uid}-starts`} hint="Blank to start now.">
                <input
                  id={`${uid}-starts`}
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Expires" htmlFor={`${uid}-expires`} hint="Blank to never expire.">
                <input
                  id={`${uid}-expires`}
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="space-y-2">
              <span className={labelClass}>Only these categories</span>
              <p className="text-xs leading-relaxed text-muted">
                Pick none to cover the whole catalogue. Pick some and only those items are discounted.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.length === 0 ? (
                  <span className="text-xs text-faint">No categories yet.</span>
                ) : (
                  categories.map((category) => {
                    const active = form.categoryIds.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all",
                          active
                            ? "bg-lavender-100 text-lavender-700 ring-lavender-400"
                            : "bg-surface text-muted ring-line hover:ring-lavender-300"
                        )}
                      >
                        {category.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={`${uid}-product-search`} className={labelClass}>
                Only these products
              </label>
              <p className="text-xs leading-relaxed text-muted">
                Narrower than categories. Leave empty unless you want to discount specific pieces.
              </p>

              {form.products.length > 0 && (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {form.products.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1.5 text-xs font-semibold text-lavender-700 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        {product.name}
                        <X className="h-3 w-3" strokeWidth={2.8} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div ref={productSearchRef} className="relative">
                <input
                  id={`${uid}-product-search`}
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products to add"
                  autoComplete="off"
                  className={inputClass}
                />

                {productResults.length > 0 && (
                  <ul className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-2xl bg-surface p-1.5 shadow-lift ring-1 ring-line">
                    {productResults.map((product) => {
                      const already = form.products.some((chosen) => chosen.id === product.id);

                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            disabled={already}
                            onClick={() => addProduct(product)}
                            className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-lavender-50 disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
                          >
                            <span className="truncate">{product.name}</span>
                            <span className="shrink-0 text-xs text-muted">
                              {already ? "Added" : formatPrice(product.price)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form.firstOrderOnly}
                onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-lavender-500"
              />
              First order only
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-lavender-500"
              />
              Accepting this code
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Create coupon"}
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
            <div className="space-y-3" role="status" aria-label="Loading coupons">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-4xl" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <EmptyState
              art={<NoResultsArt />}
              title="No coupons yet"
              description="Create your first code using the form beside this card. WELCOME10 is a good place to start."
            />
          ) : (
            <ul className="space-y-3">
              {coupons.map((coupon) => {
                const reason = inactiveReason(coupon);

                return (
                  <li
                    key={coupon.id}
                    className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-bold tracking-wide text-ink">
                            {coupon.code}
                          </span>
                          <Pill tone={reason ? "ink" : "mint"}>{reason ?? "Live"}</Pill>
                          {coupon.firstOrderOnly && <Pill tone="peach">First order</Pill>}
                          {coupon.categoryIds.length > 0 && (
                            <Pill tone="lavender">
                              {coupon.categoryIds.length} categor
                              {coupon.categoryIds.length === 1 ? "y" : "ies"}
                            </Pill>
                          )}
                          {coupon.productIds.length > 0 && (
                            <Pill tone="lavender">
                              {coupon.productIds.length} product
                              {coupon.productIds.length === 1 ? "" : "s"}
                            </Pill>
                          )}
                        </div>

                        <p className="mt-1.5 text-sm font-semibold text-ink-700">{describe(coupon)}</p>

                        {coupon.description && (
                          <p className="mt-0.5 text-xs text-muted">{coupon.description}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(coupon)}
                          aria-label={`Edit ${coupon.code}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-lavender-50 hover:text-lavender-700"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(coupon)}
                          aria-label={`Remove ${coupon.code}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-rose-50 hover:text-rose-500"
                        >
                          {coupon.redemptionCount > 0 ? (
                            <Power className="h-4 w-4" strokeWidth={2.2} />
                          ) : (
                            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                          )}
                        </button>
                      </div>
                    </div>

                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs">
                      <div className="flex gap-1.5">
                        <dt className="text-muted">Used</dt>
                        <dd className="font-semibold text-ink">
                          {coupon.usageCount}
                          {coupon.usageLimit != null ? ` of ${coupon.usageLimit}` : ""}
                        </dd>
                      </div>
                      {coupon.minOrderValue > 0 && (
                        <div className="flex gap-1.5">
                          <dt className="text-muted">Min spend</dt>
                          <dd className="font-semibold text-ink">{formatPrice(coupon.minOrderValue)}</dd>
                        </div>
                      )}
                      {coupon.expiresAt && (
                        <div className="flex gap-1.5">
                          <dt className="text-muted">Expires</dt>
                          <dd className="font-semibold text-ink">
                            {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </dd>
                        </div>
                      )}
                    </dl>
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
        label="Confirm removing this coupon"
      >
        <h2 className="text-lg text-ink">
          {pendingDelete && pendingDelete.redemptionCount > 0
            ? `Switch off ${pendingDelete.code}?`
            : `Delete ${pendingDelete?.code}?`}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {pendingDelete && pendingDelete.redemptionCount > 0
            ? `This code has been used on ${pendingDelete.redemptionCount} order${
                pendingDelete.redemptionCount === 1 ? "" : "s"
              }, so it will be switched off rather than deleted. Those orders keep their discount on record.`
            : "Nobody has used this code, so it can go for good. This cannot be undone."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={confirmDelete} loading={deleting}>
            {pendingDelete && pendingDelete.redemptionCount > 0 ? "Switch it off" : "Delete it"}
          </Button>
          <Button variant="ghost" onClick={() => setPendingDelete(null)}>
            Keep it
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
