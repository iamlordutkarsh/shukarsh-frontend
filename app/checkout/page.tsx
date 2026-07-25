"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (items.length === 0 && !success) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-2xl font-bold text-zinc-900">Your cart is empty</h1>
          <Link href="/products" className="mt-4 inline-block text-zinc-900 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-2xl font-bold text-zinc-900">Order placed!</h1>
          <p className="mt-2 text-zinc-600">Thank you for your order. We will contact you soon.</p>
          <Link href="/products" className="mt-6 inline-block rounded-md bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      clearCart();
    }, 1500);
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Checkout</h1>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!user && (
              <div className="mb-6 rounded-md bg-zinc-50 p-4 text-sm text-zinc-700">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
                  Sign in
                </Link>{" "}
                for a faster checkout.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Shipping Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="First name"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  required
                  placeholder="Last name"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <input
                required
                placeholder="Address"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  required
                  placeholder="City"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  placeholder="State"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  required
                  placeholder="ZIP"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email"
                defaultValue={user?.email || ""}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400"
              >
                {loading ? "Processing..." : `Place Order - $${totalPrice.toFixed(2)}`}
              </button>
              <p className="text-xs text-zinc-500">
                Payment integration with Stripe will be added in the next step.
              </p>
            </form>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-lg font-bold text-zinc-900">Order Summary</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-zinc-900">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
