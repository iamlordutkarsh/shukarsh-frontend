"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Trash2, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { shippingFor } from "../../lib/constants";
import { useCart } from "../../lib/cart";
import { easeSoft } from "../../lib/motion";
import { useUI } from "../../lib/ui-store";
import { formatPrice } from "../../lib/utils";
import { Button, ButtonLink } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { EmptyState } from "../ui/EmptyState";
import { EmptyCartArt } from "../ui/KawaiiArt";
import { PastelTile } from "../ui/PastelTile";
import { QuantityStepper } from "../product/QuantityStepper";

export function CartDrawer() {
  const { isOpen, close } = useUI();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const open = isOpen("cart");

  const shipping = shippingFor(totalPrice);

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Your bag"
      description={totalItems > 0 ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Nothing here yet"}
      footer={
        items.length > 0 ? (
          <div className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Shipping</dt>
                <dd className={shipping === 0 ? "font-semibold text-mint-500" : "font-semibold text-ink"}>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-display text-ink">Total</dt>
                <dd className="font-bold text-ink">{formatPrice(totalPrice + shipping)}</dd>
              </div>
            </dl>

            <ButtonLink href="/checkout" size="lg" className="w-full" onClick={close}>
              Checkout
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </ButtonLink>
            <button
              type="button"
              onClick={close}
              className="block w-full text-center text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              Keep shopping
            </button>
          </div>
        ) : null
      }
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col justify-center">
          <EmptyState
            compact
            art={<EmptyCartArt />}
            title="Your bag is feeling light"
            description="Add a little treat and it will show up right here."
            action={
              <Button onClick={close} variant="soft">
                Start shopping
              </Button>
            }
            className="border-0 bg-transparent shadow-none"
          />
        </div>
      ) : (
        <div className="space-y-5">
          <p className="flex items-center gap-2 rounded-3xl bg-lavender-50/80 px-4 py-3 text-xs font-semibold text-lavender-700">
            <Truck className="h-4 w-4 shrink-0" strokeWidth={2.3} />
            Free shipping on every order, always.
          </p>

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map(({ product, quantity }) => (
                <motion.li
                  key={product.id}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 32, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: easeSoft }}
                  className="flex gap-3 rounded-3xl bg-surface/80 p-3 shadow-soft"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={close}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-lavender-50"
                  >
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <PastelTile seed={product.slug} />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={close}
                        className="line-clamp-2 text-sm font-semibold text-ink hover:text-lavender-700"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Remove ${product.name} from bag`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </div>
                    <p className="text-xs text-muted">{product.category.name}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QuantityStepper
                        size="sm"
                        value={quantity}
                        onChange={(next) => updateQuantity(product.id, next)}
                        min={0}
                        max={Math.max(1, Math.min(10, product.stock))}
                        label={`Quantity for ${product.name}`}
                      />
                      <span className="text-sm font-bold text-ink">{formatPrice(product.price * quantity)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <Link
            href="/cart"
            onClick={close}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            View full bag
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
      )}
    </Drawer>
  );
}
