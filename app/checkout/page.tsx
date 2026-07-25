"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, ShoppingBag, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/cart";
import { fadeUp, staggerParent } from "../../lib/motion";
import { formatPrice } from "../../lib/utils";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyCartArt } from "../../components/ui/KawaiiArt";
import { PastelTile } from "../../components/ui/PastelTile";

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
  prefill: { name?: string; email: string; contact?: string };
  theme: { color: string };
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
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

const fieldClass =
  "h-12 w-full rounded-2xl border-0 bg-surface px-4 text-sm text-ink shadow-soft ring-1 ring-line transition-shadow placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
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
      <div className="section-shell py-20">
        <EmptyState
          art={<EmptyCartArt />}
          title="There is nothing to check out"
          description="Add something to your bag first and we will meet you back here."
          action={
            <ButtonLink href="/products" size="lg">
              Start shopping
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loadRazorpayScript();

      const data = await createRazorpayOrder(
        {
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            name: item.product.name,
            price: item.product.price,
            image: item.product.images[0],
          })),
          shippingAddress: {
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state || undefined,
            zip: form.zip,
            country: form.country,
          },
          email: form.email,
        },
        token || undefined
      );

      if (!window.Razorpay) throw new Error("Razorpay checkout failed to load");

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
          } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Payment verification failed");
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
        },
        theme: { color: "#8b6bff" },
      });

      razorpay.on("payment.failed", (response) => {
        setError(response.error.description || "Payment failed");
      });

      razorpay.open();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[24rem] opacity-60" />

      <div className="section-shell relative">
        <header className="max-w-2xl">
          <h1 className="text-hero text-balance">Checkout</h1>
          <p className="mt-2 text-sm text-muted">
            Two small steps: tell us where to send it, then pay securely with Razorpay.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="space-y-4">
            {!user && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-lavender-50 px-5 py-4 text-sm text-ink-700">
                <span>Have an account? Sign in for faster checkout and order tracking.</span>
                <Link href="/login" className="font-semibold text-lavender-700 hover:text-lavender-600">
                  Sign in
                </Link>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-3xl bg-rose-50 px-5 py-4 text-sm text-rose-600"
                role="alert"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                {error}
              </motion.div>
            )}

            <motion.form
              variants={staggerParent(0.05)}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit}
              className="space-y-4 rounded-4xl bg-surface/90 p-6 shadow-soft sm:p-8 hairline"
            >
              <motion.h2 variants={fadeUp} className="font-display text-xl text-ink">
                Where should it go?
              </motion.h2>

              <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  aria-label="First name"
                  placeholder="First name"
                  className={fieldClass}
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                />
                <input
                  required
                  aria-label="Last name"
                  placeholder="Last name"
                  className={fieldClass}
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                />
              </motion.div>

              <motion.input
                variants={fadeUp}
                required
                aria-label="Address"
                placeholder="Flat / house no, street"
                className={fieldClass}
                value={form.line1}
                onChange={(event) => setForm({ ...form, line1: event.target.value })}
              />

              <motion.input
                variants={fadeUp}
                aria-label="Address line 2"
                placeholder="Area, landmark (optional)"
                className={fieldClass}
                value={form.line2}
                onChange={(event) => setForm({ ...form, line2: event.target.value })}
              />

              <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  aria-label="City"
                  placeholder="City"
                  className={fieldClass}
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
                <input
                  aria-label="State"
                  placeholder="State"
                  className={fieldClass}
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                />
                <input
                  required
                  aria-label="PIN code"
                  placeholder="PIN code"
                  inputMode="numeric"
                  className={fieldClass}
                  value={form.zip}
                  onChange={(event) => setForm({ ...form, zip: event.target.value })}
                />
              </motion.div>

              <motion.input
                variants={fadeUp}
                required
                type="email"
                aria-label="Email"
                placeholder="Email for your receipt"
                className={fieldClass}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />

              <motion.div variants={fadeUp} className="pt-1">
                <Button type="submit" loading={loading} size="lg" className="w-full">
                  <CreditCard className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.3} />
                  {loading ? "Opening Razorpay" : `Pay ${formatPrice(totalPrice)}`}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Cards, UPI, wallets and net banking, all handled by Razorpay.
                </p>
              </motion.div>
            </motion.form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-4xl bg-surface/90 p-6 shadow-soft hairline">
              <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                <ShoppingBag className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                Your order
              </h2>

              <ul className="mt-5 space-y-3">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3">
                    <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <PastelTile seed={product.slug} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                      <span className="block text-xs text-muted">Qty {quantity}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Shipping</dt>
                  <dd className="font-semibold text-mint-400">Free</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="font-display text-lg text-ink">Total</dt>
                  <dd className="text-xl font-bold text-ink">{formatPrice(totalPrice)}</dd>
                </div>
              </dl>
            </div>

            <Link
              href="/cart"
              className="block text-center text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              Edit your bag
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
