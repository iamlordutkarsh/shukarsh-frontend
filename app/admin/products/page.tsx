"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { StockAdjuster } from "../../../components/admin/StockAdjuster";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Modal } from "../../../components/ui/Modal";
import { Pill } from "../../../components/ui/Pill";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { deleteProduct, getProducts } from "../../../lib/api";
import { isLowStock } from "../../../lib/inventory";
import { usesDefaultPackaging } from "../../../lib/packaging";
import { useAuth } from "../../../lib/auth";
import { Product } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";

function stockClass(product: Product) {
  if (product.stock <= 0) return "bg-rose-50 text-rose-500 hover:bg-rose-100";
  if (isLowStock(product)) return "bg-peach-100 text-peach-400 hover:bg-peach-200";
  return "bg-mint-100 text-mint-400 hover:bg-mint-200";
}

/** The badge is the way in: the number itself is what you want to click. */
function StockBadge({ product, onAdjust }: { product: Product; onAdjust: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdjust}
      aria-label={`Adjust stock for ${product.name}`}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] transition-colors",
        stockClass(product)
      )}
    >
      {product.stock <= 0 ? "Sold out" : `${product.stock} in stock`}
    </button>
  );
}

/**
 * Shown against the product rather than as one warning at the top, because the
 * only useful version of this tells you which row to open.
 */
function PackagingFlag({ product, className }: { product: Product; className?: string }) {
  if (!usesDefaultPackaging(product)) return null;
  return (
    <Pill tone="peach" className={className}>
      <Ruler className="h-3 w-3" strokeWidth={2.6} />
      Unmeasured
      <span className="sr-only">
        packaging: still the default half kilo box, so a shipping quote may come in under what the
        courier charges
      </span>
    </Pill>
  );
}

function Thumb({ product, className }: { product: Product; className?: string }) {
  const image = product.images?.[0];
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-2xl bg-lavender-100", className)}>
      {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}

function RowActions({ product, onDelete }: { product: Product; onDelete: (product: Product) => void }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <ButtonLink
        href={`/admin/products/${product.slug}/edit`}
        variant="secondary"
        size="icon-sm"
        aria-label={`Edit ${product.name}`}
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
      </ButtonLink>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${product.name}`}
        onClick={() => onDelete(product)}
        className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
      </Button>
    </div>
  );
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await getProducts({ limit: 100, sort: "newest" });
        if (active) setProducts(data.products);
      } catch (err) {
        if (active) {
          toast({
            title: "Could not load products",
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
  }, [toast]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (!token) {
      toast({ title: "Session expired", description: "Sign in again to delete products.", tone: "error" });
      return;
    }

    setDeleting(true);
    try {
      await deleteProduct(token, pendingDelete.id);
      setProducts((current) => current.filter((item) => item.id !== pendingDelete.id));
      toast({ title: "Product deleted", description: `${pendingDelete.name} is gone.`, tone: "success" });
      setPendingDelete(null);
    } catch (err) {
      toast({
        title: "Could not delete product",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Products"
      subtitle="Every piece in the shop, with stock and pricing at a glance."
      actions={
        <ButtonLink href="/admin/products/new">
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Add product
        </ButtonLink>
      }
    >
      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading products">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-3xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          art={<NoResultsArt />}
          title="No products yet"
          description="Add your first piece and it will show up right here."
          action={<ButtonLink href="/admin/products/new">Add your first product</ButtonLink>}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-4xl bg-surface/90 shadow-soft hairline sm:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <caption className="sr-only">Products in the catalogue</caption>
                <thead>
                  <tr className="bg-surface-soft">
                    <th
                      scope="col"
                      className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint"
                    >
                      Price
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-right text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:bg-lavender-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Thumb product={product} className="h-14 w-12" />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/products/${product.slug}/edit`}
                              className="block truncate text-sm font-semibold text-ink transition-colors hover:text-lavender-700"
                            >
                              {product.name}
                            </Link>
                            <span className="mt-0.5 block truncate font-mono text-xs text-faint">{product.slug}</span>
                            <PackagingFlag product={product} className="mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Pill tone="lavender">{product.category.name}</Pill>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-ink">{formatPrice(product.price)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="ml-2 text-xs text-faint line-through">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StockBadge product={product} onAdjust={() => setAdjusting(product)} />
                      </td>
                      <td className="px-5 py-4">
                        <RowActions product={product} onDelete={setPendingDelete} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 sm:hidden">
            {products.map((product) => (
              <li key={product.id} className="rounded-4xl bg-surface/90 p-4 shadow-soft hairline">
                <div className="flex items-start gap-3">
                  <Thumb product={product} className="h-16 w-14" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/products/${product.slug}/edit`}
                      className="block truncate text-sm font-semibold text-ink"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm font-bold text-ink">{formatPrice(product.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Pill tone="lavender">{product.category.name}</Pill>
                      <StockBadge product={product} onAdjust={() => setAdjusting(product)} />
                      <PackagingFlag product={product} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <RowActions product={product} onDelete={setPendingDelete} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        label="Confirm product deletion"
        className="max-w-md"
      >
        <div className="p-7 sm:p-8">
          <h2 className="pr-10 text-xl text-ink">Delete this product?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {pendingDelete?.name} will be removed from the storefront. This cannot be undone.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="dark" loading={deleting} onClick={confirmDelete}>
              Delete product
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
          </div>
        </div>
      </Modal>

      {adjusting && token && (
        <StockAdjuster
          product={adjusting}
          token={token}
          open
          onClose={() => setAdjusting(null)}
          onSaved={(updated) =>
            setProducts((current) =>
              current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            )
          }
        />
      )}
    </AdminLayout>
  );
}
