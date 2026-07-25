"use client";

import Link from "next/link";
import { useCart } from "../../lib/cart";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-zinc-900">Your cart is empty</h1>
          <p className="mt-2 text-zinc-600">Add some products to get started.</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Shopping Cart</h1>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {items.map((item) => {
              const image = item.product.images[0] || "https://placehold.co/100x100?text=No+Image";
              return (
                <div
                  key={item.product.id}
                  className="flex gap-4 border-b border-zinc-200 py-6"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold text-zinc-900 hover:text-zinc-700"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="text-sm text-zinc-500">{item.product.category.name}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <select
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                      >
                        {Array.from({ length: Math.min(10, item.product.stock) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <span className="font-semibold text-zinc-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-lg font-bold text-zinc-900">Order Summary</h2>
            <div className="mt-4 flex justify-between text-zinc-900">
              <span>Subtotal</span>
              <span className="font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-500">Shipping and taxes calculated at checkout.</p>
            <Link
              href="/checkout"
              className="mt-6 block rounded-md bg-zinc-900 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
