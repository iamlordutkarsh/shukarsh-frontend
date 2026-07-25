"use client";

import Link from "next/link";
import { useCart } from "../../lib/cart";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-12 shadow-sm">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Your cart is empty</h1>
            <p className="mt-2 text-[var(--text-muted)]">Add some products to get started.</p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-lg bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary)]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Shopping Cart</h1>
        <p className="mt-2 text-[var(--text-muted)]">{items.length} item{items.length !== 1 && "s"} in your cart</p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const image = item.product.images[0] || "https://placehold.co/100x100?text=No+Image";
              return (
                <div
                  key={item.product.id}
                  className="flex gap-5 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-lg bg-[var(--muted)] object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{item.product.category.name}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <select
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                        className="h-9 w-16 rounded-lg border border-[var(--border)] bg-white text-center text-sm focus:border-[var(--primary)] focus:outline-none"
                      >
                        {Array.from({ length: Math.min(10, item.product.stock) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="font-bold text-[var(--foreground)]">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Order Summary</h2>
            <div className="mt-4 flex justify-between border-b border-[var(--border)] pb-4 text-[var(--foreground)]">
              <span className="text-[var(--text-muted)]">Subtotal</span>
              <span className="font-bold">₹{totalPrice.toFixed(2)}</span>
            </div>
            <p className="mt-4 text-sm text-[var(--text-muted)]">Shipping and taxes calculated at checkout.</p>
            <Link
              href="/checkout"
              className="mt-6 block rounded-lg bg-[var(--foreground)] py-3 text-center text-sm font-semibold text-white hover:bg-[var(--primary)]"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
