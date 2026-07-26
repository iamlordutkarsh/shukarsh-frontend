"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Trash2, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "../../lib/cart";
import { easeSoft } from "../../lib/motion";
import { formatPrice } from "../../lib/utils";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { QuantityStepper } from "../../components/product/QuantityStepper";
import { WishlistButton } from "../../components/product/WishlistButton";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyCartArt } from "../../components/ui/KawaiiArt";
import { PastelTile } from "../../components/ui/PastelTile";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[24rem] opacity-60" />

      <div className="section-shell relative">
        <header className="max-w-2xl">
          <h1 className="text-hero text-balance">Your bag</h1>
          <p className="mt-2 text-sm text-muted">
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? "piece" : "pieces"} waiting to come home with you.`
              : "Nothing in here yet."}
          </p>
        </header>

        {items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              art={<EmptyCartArt />}
              title="Your bag is feeling light"
              description="Browse the collections and add something soft. We will keep it saved on this device."
              action={
                <ButtonLink href="/products" size="lg">
                  Start shopping
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map(({ product, quantity }) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.32, ease: easeSoft }}
                    className="flex gap-4 rounded-4xl bg-surface/85 p-4 shadow-soft sm:gap-5 sm:p-5 hairline"
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      className="relative h-28 w-24 shrink-0 overflow-hidden rounded-3xl bg-lavender-50 sm:h-32 sm:w-28"
                    >
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      ) : (
                        <PastelTile seed={product.slug} />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-lavender-500">
                            {product.category.name}
                          </p>
                          <Link
                            href={`/products/${product.slug}`}
                            className="mt-0.5 block font-display text-lg leading-snug text-ink transition-colors hover:text-lavender-700"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-sm text-muted">{formatPrice(product.price)} each</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <WishlistButton product={product} size="sm" />
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Remove ${product.name} from bag`}
                            className="grid h-9 w-9 place-items-center rounded-full bg-surface text-faint shadow-soft transition-colors hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.3} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <QuantityStepper
                          value={quantity}
                          onChange={(next) => updateQuantity(product.id, next)}
                          min={0}
                          max={Math.max(1, Math.min(10, product.stock))}
                          label={`Quantity for ${product.name}`}
                        />
                        <span className="text-lg font-bold text-ink">
                          {formatPrice(product.price * quantity)}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <aside className="space-y-4 lg:sticky lg:top-28">
              <div className="rounded-4xl bg-surface/90 p-6 shadow-soft hairline">
                <h2 className="font-display text-xl text-ink">Summary</h2>

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted">
                    <dt>Subtotal</dt>
                    <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
                  </div>
                  <div className="flex justify-between text-muted">
                    <dt>Shipping</dt>
                    <dd className="font-semibold text-faint">Calculated at checkout</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line pt-3">
                    <dt className="font-display text-lg text-ink">Total</dt>
                    <dd className="text-xl font-bold text-ink">{formatPrice(totalPrice)}</dd>
                  </div>
                </dl>

                <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
                  Checkout
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </ButtonLink>

                <Link
                  href="/products"
                  className="mt-3 block text-center text-xs font-semibold text-muted transition-colors hover:text-ink"
                >
                  Keep shopping
                </Link>
              </div>

              <ul className="space-y-2">
                {[
                  { icon: Truck, label: "Live courier rates at checkout" },
                  { icon: ShieldCheck, label: "Secure payments via Razorpay" },
                ].map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex items-center gap-2.5 rounded-3xl bg-surface/70 px-4 py-3 text-[0.8125rem] font-medium text-ink-700 hairline"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.3} />
                    {label}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
