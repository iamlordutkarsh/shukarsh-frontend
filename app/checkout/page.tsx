"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, MapPin, ShoppingBag, Star, Truck, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  createRazorpayOrder,
  getShippingRates,
  lookupPincode,
  verifyRazorpayPayment,
  type ShippingRates,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/cart";
import { INDIAN_STATES, canonicalState } from "../../lib/constants";
import { fadeUp, staggerParent } from "../../lib/motion";
import { cn, displayName, formatPrice } from "../../lib/utils";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyCartArt } from "../../components/ui/KawaiiArt";
import { PastelTile } from "../../components/ui/PastelTile";
import { Skeleton } from "../../components/ui/Skeleton";

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

const PINCODE = /^[1-9]\d{5}$/;
const PHONE = /^[6-9]\d{9}$/;

function normalizePhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^91(?=\d{10}$)/, "")
    .slice(0, 10);
}

function etdLabel(option: { etd: string | null; etdDays: number | null }) {
  if (option.etdDays) return `${option.etdDays} day${option.etdDays === 1 ? "" : "s"}`;
  if (option.etd) return option.etd.split(" ")[0];
  return null;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: displayName(user?.firstName, user?.lastName) ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    email: user?.email || "",
  });

  const [quote, setQuote] = useState<{ key: string; data: ShippingRates | null; error: string } | null>(null);
  const [preferredCourierId, setPreferredCourierId] = useState<number | null>(null);

  const pincodeReady = PINCODE.test(form.zip);
  const lineItems = useMemo(
    () => items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    [items]
  );
  /** A quote is only valid for the bag and PIN code it was fetched for. */
  const quoteKey = `${form.zip}|${lineItems.map((line) => `${line.productId}:${line.quantity}`).join(",")}`;

  /** Fill in city and state from the PIN code so nobody has to type them. */
  useEffect(() => {
    if (!pincodeReady) return;
    const pincode = form.zip;
    let active = true;

    const timer = setTimeout(() => {
      lookupPincode(pincode)
        .then((details) => {
          if (!active) return;
          setForm((current) => {
            if (current.zip !== pincode) return current;
            return {
              ...current,
              city: current.city || details.city || "",
              state: current.state || canonicalState(details.state) || "",
            };
          });
        })
        .catch(() => {});
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.zip, pincodeReady]);

  /** Live courier rates for this bag and this PIN code. */
  useEffect(() => {
    if (!pincodeReady || lineItems.length === 0) return;

    const key = quoteKey;
    const pincode = form.zip;
    let active = true;

    const timer = setTimeout(() => {
      getShippingRates({ pincode, items: lineItems })
        .then((data) => {
          if (active) setQuote({ key, data, error: "" });
        })
        .catch((err) => {
          if (!active) return;
          setQuote({
            key,
            data: null,
            error: err instanceof Error ? err.message : "Could not fetch delivery options",
          });
        });
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [quoteKey, form.zip, pincodeReady, lineItems]);

  const settledQuote = quote?.key === quoteKey ? quote : null;
  const rates = settledQuote?.data ?? null;
  const ratesError = settledQuote?.error ?? "";
  const ratesLoading = pincodeReady && lineItems.length > 0 && settledQuote === null;

  const liveShipping = rates?.enabled === true;
  const options = rates?.options ?? [];
  const selectedCourier =
    options.find((option) => option.courierId === preferredCourierId) ??
    options.find((option) => option.recommended) ??
    options[0] ??
    null;
  const shippingAmount = liveShipping && selectedCourier ? Math.round(selectedCourier.rate) : 0;
  const total = totalPrice + shippingAmount;
  const unserviceable = liveShipping && rates !== null && !rates.serviceable;

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

    if (!PHONE.test(form.phone)) {
      setError("Enter a valid 10 digit Indian mobile number so the courier can reach you.");
      return;
    }
    if (!form.state) {
      setError("Please pick your state.");
      return;
    }
    if (unserviceable) {
      setError("No courier delivers to this PIN code yet. Try another address.");
      return;
    }

    setLoading(true);

    try {
      await loadRazorpayScript();

      const data = await createRazorpayOrder(
        {
          items: lineItems,
          shippingAddress: {
            name: form.name,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: "India",
          },
          email: form.email,
          ...(selectedCourier ? { courierId: selectedCourier.courierId } : {}),
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
          name: form.name,
          email: form.email,
          contact: form.phone,
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

  const shippingLabel = () => {
    if (!pincodeReady) return <dd className="font-semibold text-faint">Enter your PIN code</dd>;
    if (ratesLoading) return <dd className="font-semibold text-faint">Checking couriers…</dd>;
    if (unserviceable) return <dd className="font-semibold text-rose-500">Not serviceable</dd>;
    if (!liveShipping || !selectedCourier) return <dd className="font-semibold text-mint-400">Free</dd>;
    return <dd className="font-semibold text-ink">{formatPrice(shippingAmount)}</dd>;
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
                  minLength={3}
                  aria-label="Full name"
                  placeholder="Full name"
                  autoComplete="name"
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <input
                  required
                  aria-label="Mobile number"
                  placeholder="10 digit mobile number"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className={fieldClass}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: normalizePhone(event.target.value) })}
                />
              </motion.div>

              <motion.input
                variants={fadeUp}
                required
                minLength={5}
                aria-label="Address"
                placeholder="Flat / house no, street"
                autoComplete="address-line1"
                className={fieldClass}
                value={form.line1}
                onChange={(event) => setForm({ ...form, line1: event.target.value })}
              />

              <motion.input
                variants={fadeUp}
                aria-label="Address line 2"
                placeholder="Area, landmark (optional)"
                autoComplete="address-line2"
                className={fieldClass}
                value={form.line2}
                onChange={(event) => setForm({ ...form, line2: event.target.value })}
              />

              <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  aria-label="PIN code"
                  placeholder="PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={fieldClass}
                  value={form.zip}
                  onChange={(event) =>
                    setForm({ ...form, zip: event.target.value.replace(/\D/g, "").slice(0, 6) })
                  }
                />
                <input
                  required
                  aria-label="City"
                  placeholder="City"
                  autoComplete="address-level2"
                  className={fieldClass}
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                />
                <select
                  required
                  aria-label="State"
                  className={fieldClass}
                  value={form.state}
                  onChange={(event) => setForm({ ...form, state: event.target.value })}
                >
                  <option value="">State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.input
                variants={fadeUp}
                required
                type="email"
                aria-label="Email"
                placeholder="Email for your receipt"
                autoComplete="email"
                className={fieldClass}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />

              <motion.div variants={fadeUp} className="pt-1">
                <Button type="submit" loading={loading} size="lg" className="w-full" disabled={unserviceable}>
                  <CreditCard className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.3} />
                  {loading ? "Opening Razorpay" : `Pay ${formatPrice(total)}`}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Cards, UPI, wallets and net banking, all handled by Razorpay.
                </p>
              </motion.div>
            </motion.form>

            {pincodeReady && (liveShipping || ratesLoading || ratesError) && (
              <section
                className="rounded-4xl bg-surface/90 p-6 shadow-soft sm:p-8 hairline"
                aria-label="Delivery options"
              >
                <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                  <Truck className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                  How should we ship it?
                </h2>

                {ratesLoading ? (
                  <div className="mt-5 space-y-3" role="status" aria-label="Loading delivery options">
                    <Skeleton className="h-16 w-full rounded-3xl" />
                    <Skeleton className="h-16 w-full rounded-3xl" />
                  </div>
                ) : ratesError ? (
                  <p className="mt-4 text-sm text-muted">
                    {ratesError} We will pick the best courier for you after checkout.
                  </p>
                ) : unserviceable ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-3xl bg-rose-50 px-4 py-3.5 text-sm text-rose-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                    <span>
                      No courier is delivering to {form.zip} right now. Try a different PIN code and we will
                      re-check instantly.
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="mt-1.5 text-sm text-muted">
                      Rates are live from Shiprocket for
                      {rates?.weightKg ? ` a ${rates.weightKg} kg parcel` : " your parcel"} going to {form.zip}.
                    </p>

                    <ul className="mt-5 space-y-2.5">
                      {options.map((option) => {
                        const active = option.courierId === selectedCourier?.courierId;
                        const eta = etdLabel(option);

                        return (
                          <li key={option.courierId}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-3xl px-4 py-3.5 ring-1 transition-all",
                                active
                                  ? "bg-lavender-50 ring-2 ring-lavender-400"
                                  : "bg-surface ring-line hover:ring-lavender-300"
                              )}
                            >
                              <input
                                type="radio"
                                name="courier"
                                className="h-4 w-4 shrink-0 accent-lavender-500"
                                checked={active}
                                onChange={() => setPreferredCourierId(option.courierId)}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-ink">
                                    {option.courierName}
                                  </span>
                                  {option.recommended && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-mint-400">
                                      <Star className="h-2.5 w-2.5" strokeWidth={3} />
                                      Best
                                    </span>
                                  )}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted">
                                  {eta ? `Arrives in about ${eta}` : "Delivery estimate on dispatch"}
                                  {option.isSurface ? " · Surface" : " · Air"}
                                </span>
                              </span>
                              <span className="shrink-0 text-sm font-bold text-ink">
                                {formatPrice(Math.round(option.rate))}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </section>
            )}
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
                  {shippingLabel()}
                </div>
                {selectedCourier && (
                  <p className="text-xs text-faint">via {selectedCourier.courierName}</p>
                )}
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="font-display text-lg text-ink">Total</dt>
                  <dd className="text-xl font-bold text-ink">{formatPrice(total)}</dd>
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
