"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgePercent, ChevronRight, ShieldCheck, Sparkles, Trash2, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cartLineKey, lineStock, toApiItems, useCart } from "../../lib/cart";
import { ChooseSize } from "../cart/ChooseSize";
import { deliveryFor, useDeliveryPolicy } from "../../lib/delivery";
import { easeSoft } from "../../lib/motion";
import { useUI } from "../../lib/ui-store";
import { formatPrice } from "../../lib/utils";
import { Button, ButtonLink } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { EmptyState } from "../ui/EmptyState";
import { EmptyCartArt } from "../ui/KawaiiArt";
import { PastelTile } from "../ui/PastelTile";
import { QuantityStepper } from "../product/QuantityStepper";
import { BagDeliveryCheck, type BagDeliveryQuote } from "../cart/BagDeliveryCheck";

const TRUST = [
  { icon: Sparkles, label: "Handpicked pieces" },
  { icon: ShieldCheck, label: "Secure payments" },
  { icon: Truck, label: "Tracked delivery" },
];

export function CartDrawer() {
  const { isOpen, close } = useUI();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const open = isOpen("cart");

  const [deliveryQuote, setDeliveryQuote] = useState<BagDeliveryQuote | null>(null);

  const lineItems = useMemo(() => toApiItems(items), [items]);
  const cartKey = useMemo(
    () => lineItems.map((line) => `${line.productId}:${line.variantId ?? ""}:${line.quantity}`).join(","),
    [lineItems]
  );

  /**
   * What the bag would have cost at list price. Compare price is only a saving
   * when it is actually above what we charge, so a stale or lower one falls
   * back to the real price rather than inventing a discount.
   */
  const listTotal = items.reduce((sum, { product, quantity }) => {
    const listed = product.comparePrice && product.comparePrice > product.price ? product.comparePrice : product.price;
    return sum + listed * quantity;
  }, 0);
  const savings = listTotal - totalPrice;

  const delivery = deliveryQuote?.key === cartKey ? deliveryQuote.rates : null;

  /**
   * Stated from the shop's policy rather than waiting on a PIN code, because the
   * fee does not depend on where the parcel is going. A quote, once there is one,
   * is the same figure from the server that will charge it.
   */
  const policy = useDeliveryPolicy(open);
  const fromPolicy = deliveryFor(totalPrice, policy);
  const deliveryFee = delivery?.shippingAmount ?? fromPolicy?.fee ?? null;
  const shortfall = delivery?.shortfall ?? fromPolicy?.shortfall ?? 0;

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Your bag"
      description={totalItems > 0 ? `${totalItems} item${totalItems === 1 ? "" : "s"}` : "Nothing here yet"}
      footer={
        items.length > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-ink">{formatPrice(totalPrice)}</p>
              <Link
                href="/cart"
                onClick={close}
                className="text-xs font-semibold text-lavender-700 transition-colors hover:text-lavender-600"
              >
                View full bag
              </Link>
            </div>

            <ButtonLink href="/checkout" size="lg" className="shrink-0" onClick={close}>
              Proceed to buy
            </ButtonLink>
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
        <div className="space-y-4">
          <BagDeliveryCheck items={lineItems} cartKey={cartKey} onResult={setDeliveryQuote} />

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const { product, quantity } = item;
                const stock = lineStock(item);

                return (
                <motion.li
                  key={cartLineKey(item)}
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
                      <div className="min-w-0">
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-lavender-500">
                          {product.category.name}
                        </p>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={close}
                          className="mt-0.5 line-clamp-2 block text-sm font-semibold text-ink hover:text-lavender-700"
                        >
                          {product.name}
                        </Link>
                        {item.variantLabel ? (
                          <p className="mt-0.5 text-xs font-semibold text-muted">Size {item.variantLabel}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(cartLineKey(item))}
                        aria-label={`Remove ${product.name}${
                          item.variantLabel ? ` in ${item.variantLabel}` : ""
                        } from bag`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.3} />
                      </button>
                    </div>

                    <ChooseSize item={item} />

                    {stock <= 3 && (
                      <p className="text-[0.6875rem] font-semibold text-peach-400">Only {stock} left</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QuantityStepper
                        size="sm"
                        value={quantity}
                        onChange={(next) => updateQuantity(cartLineKey(item), next)}
                        min={0}
                        max={Math.max(1, Math.min(10, stock))}
                        label={`Quantity for ${product.name}${
                          item.variantLabel ? ` in ${item.variantLabel}` : ""
                        }`}
                      />
                      <span className="text-sm font-bold text-ink">{formatPrice(product.price * quantity)}</span>
                    </div>
                  </div>
                </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <p className="flex items-baseline justify-between border-y border-line py-3 text-sm text-muted">
            You pay
            <span className="text-base font-bold text-ink">{formatPrice(totalPrice)}</span>
          </p>

          {/*
            Codes are priced by the server against a finished order, so the one
            place that can honestly say what a coupon is worth is checkout.
          */}
          <Link
            href="/checkout"
            onClick={close}
            className="flex items-center gap-3 rounded-3xl bg-surface/80 p-4 shadow-soft transition-shadow hover:shadow-lift hairline"
          >
            <BadgePercent className="h-5 w-5 shrink-0 text-lavender-500" strokeWidth={2.3} />
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-bold text-ink">Coupons</span>
              <span className="block text-xs text-muted">Add a code at checkout and save extra</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-faint" strokeWidth={2.4} />
          </Link>

          <section className="rounded-3xl bg-surface/80 p-4 shadow-soft hairline">
            <h3 className="text-[0.8125rem] font-bold text-ink">Price summary</h3>
            <p className="mt-0.5 text-xs text-muted">Prices are inclusive of GST</p>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <dt>
                  Bag total ({totalItems} item{totalItems === 1 ? "" : "s"})
                </dt>
                <dd className="font-semibold text-ink">{formatPrice(listTotal)}</dd>
              </div>

              {savings > 0 && (
                <div className="flex justify-between text-mint-400">
                  <dt>Discount</dt>
                  <dd className="font-semibold">−{formatPrice(savings)}</dd>
                </div>
              )}

              <div className="flex justify-between text-muted">
                <dt>Sub total</dt>
                <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
              </div>

              <div className="flex justify-between text-muted">
                <dt>Delivery</dt>
                {deliveryFee === null ? (
                  <dd className="font-semibold text-faint">Calculated at checkout</dd>
                ) : deliveryFee === 0 ? (
                  <dd className="font-semibold text-mint-400">Free</dd>
                ) : (
                  <dd className="font-semibold text-ink">{formatPrice(deliveryFee)}</dd>
                )}
              </div>

              {shortfall > 0 && (
                <p className="text-xs font-semibold text-lavender-700">
                  Add {formatPrice(shortfall)} more and delivery is on us.
                </p>
              )}

              <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                <dt className="font-display text-base text-ink">You pay</dt>
                <dd className="text-lg font-bold text-ink">{formatPrice(totalPrice + (deliveryFee ?? 0))}</dd>
              </div>
            </dl>
          </section>

          <ul className="grid grid-cols-3 gap-2 rounded-3xl bg-lavender-50/70 px-3 py-3.5">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon className="h-4 w-4 text-lavender-500" strokeWidth={2.3} />
                <span className="text-[0.6875rem] font-semibold leading-tight text-ink-700">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
