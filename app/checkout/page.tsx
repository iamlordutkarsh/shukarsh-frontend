"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../lib/cart";
import { useAuth } from "../../lib/auth";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../lib/api";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill: {
    name?: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "IN",
    email: user?.email || "",
  });

  if (items.length === 0) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loadRazorpayScript();

      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        name: item.product.name,
        price: item.product.price,
        image: item.product.images[0],
      }));

      const data = await createRazorpayOrder({
        items: orderItems,
        shippingAddress: {
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state || undefined,
          zip: form.zip,
          country: form.country,
        },
        email: form.email,
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load");
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Shukarsh",
        description: "Order payment",
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            router.push("/checkout/success");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed");
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
        },
        theme: {
          color: "#171717",
        },
      });

      razorpay.on("payment.failed", (response) => {
        setError(response.error.description || "Payment failed");
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
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

            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Shipping Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <input
                required
                placeholder="Address"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <input
                placeholder="Apartment, suite, etc. (optional)"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  required
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
                <input
                  required
                  placeholder="PIN code"
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400"
              >
                {loading ? "Processing..." : `Pay ₹${totalPrice.toFixed(2)}`}
              </button>
              <p className="text-xs text-zinc-500">
                You will pay securely with Razorpay. Card, UPI, and net banking are supported.
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
                  <span className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-zinc-900">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
