"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgePercent, CreditCard, Lock, MapPin, ShoppingBag, Truck, TriangleAlert, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  createRazorpayOrder,
  getDeliveryQuote,
  getOrderQuote,
  lookupPincode,
  verifyRazorpayPayment,
  type DeliveryQuote,
  type OrderQuote,
  type PaymentMethod,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useCart } from "../../lib/cart";
import { INDIAN_STATES, ORDER_PLACED_KEY, canonicalState } from "../../lib/constants";
import { deliveryFor, useDeliveryPolicy } from "../../lib/delivery";
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
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^0+/, "")
    .replace(/^91(?=\d{10}$)/, "")
    .slice(0, 10);
}

/** A radio the whole row selects, since a 16px circle is not a tap target. */
function PayOption({
  checked,
  onSelect,
  title,
  detail,
  disabled = false,
  tone = "default",
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
  disabled?: boolean;
  tone?: "default" | "muted";
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-3xl border px-4 py-3.5 transition-colors",
        checked ? "border-lavender-300 bg-lavender-50" : "border-line bg-surface hover:bg-lavender-50/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        type="radio"
        name="paymentMethod"
        className="mt-1 h-4 w-4 shrink-0 accent-lavender-500"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className={cn("mt-0.5 block text-xs leading-relaxed", tone === "muted" ? "text-rose-500" : "text-muted")}>
          {detail}
        </span>
      </span>
    </label>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
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

  const [quote, setQuote] = useState<{ key: string; data: DeliveryQuote | null; error: string } | null>(null);

  const pincodeReady = PINCODE.test(form.zip);
  const lineItems = useMemo(
    () => items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    [items]
  );
  const cartKey = useMemo(
    () => lineItems.map((line) => `${line.productId}:${line.quantity}`).join(","),
    [lineItems]
  );
  /** A quote is only valid for the bag and PIN code it was fetched for. */
  const quoteKey = `${form.zip}|${cartKey}`;

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

  /** Whether we deliver there, and how long it takes. */
  useEffect(() => {
    if (!pincodeReady || lineItems.length === 0) return;

    const key = quoteKey;
    const pincode = form.zip;
    let active = true;

    const timer = setTimeout(() => {
      getDeliveryQuote({ pincode, items: lineItems })
        .then((data) => {
          if (active) setQuote({ key, data, error: "" });
        })
        .catch((err) => {
          if (!active) return;
          setQuote({
            key,
            data: null,
            error: err instanceof Error ? err.message : "Could not check delivery to this PIN code",
          });
        });
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [quoteKey, form.zip, pincodeReady, lineItems]);

  const settledQuote = quote?.key === quoteKey ? quote : null;
  const delivery = settledQuote?.data ?? null;
  const deliveryLoading = pincodeReady && lineItems.length > 0 && settledQuote === null;

  const etaDays = delivery?.etdDays ?? null;
  const policy = useDeliveryPolicy();

  const [couponInput, setCouponInput] = useState("");
  /** The code we are actually pricing against, only set once it is submitted. */
  const [couponCode, setCouponCode] = useState("");
  const [couponPending, setCouponPending] = useState(false);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("PREPAID");

  const quoteFor = `${quoteKey}|${form.state}|${couponCode}|${payMethod}`;
  const [quoted, setQuoted] = useState<{ key: string; cartKey: string; data: OrderQuote } | null>(null);

  useEffect(() => {
    if (lineItems.length === 0) return;

    const key = quoteFor;
    const bag = cartKey;
    let active = true;

    const timer = setTimeout(() => {
      getOrderQuote(
        {
          items: lineItems,
          ...(pincodeReady ? { pincode: form.zip } : {}),
          ...(form.state ? { state: form.state } : {}),
          ...(couponCode ? { couponCode } : {}),
          // Half of a typed address is not an address. Sending one would have
          // the quote rejected and take the GST line and the discount with it.
          ...(EMAIL.test(form.email) ? { email: form.email } : {}),
          paymentMethod: payMethod,
        },
        token || undefined
      )
        .then((data) => {
          if (active) setQuoted({ key, cartKey: bag, data });
        })
        .catch(() => {
          // Whatever settled last stays on screen. It is at most a moment out
          // of date, and blanking it sends the total back to the undiscounted
          // one, which reads as a pricing glitch rather than a slow network.
        })
        .finally(() => {
          if (active) setCouponPending(false);
        });
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [quoteFor, cartKey, lineItems, pincodeReady, form.zip, form.state, form.email, couponCode, payMethod, token]);

  /**
   * The last quote that settled, kept on screen while the next one is in
   * flight. Address entry re-quotes on every keystroke, and dropping the
   * figures each time made the discount and GST blink out and the total bounce
   * back up. Only a changed bag makes the old numbers actually wrong.
   */
  const priced = quoted?.cartKey === cartKey ? quoted.data : null;
  const pricedStale = priced !== null && quoted!.key !== quoteFor;
  /**
   * The GST already sitting inside the total, worked out by the same server code
   * that will charge it. Prices are MRP so this never moves the total; it only
   * says how much of it is tax, which an Indian invoice has to state.
   */
  const tax = priced?.tax ?? null;
  const showTax = tax?.enabled === true && tax.total > 0;
  const appliedCoupon = priced?.coupon ?? null;
  const couponError = priced?.couponError ?? null;

  /**
   * The server is the one that knows what a code is worth, so applying one is
   * just re-pricing the bag with it attached.
   */
  const applyCode = () => {
    const next = couponInput.trim().toUpperCase();
    if (!next || next === couponCode) return;
    setCouponPending(true);
    setCouponCode(next);
  };

  const removeCode = () => {
    setCouponInput("");
    setCouponCode("");
  };

  const discount = priced?.discountTotal ?? 0;

  /**
   * The priced quote's answer first, because /orders/create enforces that exact
   * field and will refuse the order on it. The delivery check is the same fact
   * from the same courier data, just fetched earlier.
   */
  const unserviceable =
    priced?.serviceable === false || (priced == null && delivery?.enabled === true && !delivery.serviceable);

  /**
   * The priced quote is the figure being charged, so it wins. The other two are
   * fallbacks for before an address exists or when a call fails, and none of them
   * needs a pincode: what delivery costs is decided by the order value, not by
   * how far the parcel has to travel.
   */
  const deliveryFee =
    priced?.shippingAmount ?? delivery?.shippingAmount ?? deliveryFor(totalPrice - discount, policy)?.fee ?? 0;
  const deliveryFree = deliveryFee === 0;
  // Until a quote settles, the locally summed total is the honest thing to show.
  const displayTotal = priced ? priced.totalAmount : totalPrice + deliveryFee;

  /**
   * The server decides whether this bag may be paid in cash, and says why not.
   * Read straight from the quote rather than mirrored into state: a bag that
   * grows past the cap has to lose the option on the spot, and resetting a
   * choice from an effect is how the two get out of step.
   */
  const codRefused = priced?.codError ?? null;
  const codFee = priced?.codFee ?? 0;
  const cod = policy?.cod ?? null;
  const payingCash = payMethod === "COD" && !codRefused;

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
      if (!payingCash) await loadRazorpayScript();

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
          ...(couponCode ? { couponCode } : {}),
          paymentMethod: payingCash ? "COD" : "PREPAID",
        },
        token || undefined
      );

      // Nothing to pay for now, so the order is already placed and the only
      // thing left is to say so.
      if (data.paymentMethod === "COD") {
        clearCart();
        sessionStorage.setItem(ORDER_PLACED_KEY, data.orderId);
        router.push("/checkout/success");
        return;
      }

      if (!window.Razorpay) throw new Error("Razorpay checkout failed to load");
      if (!data.razorpayOrderId || !data.keyId) throw new Error("Could not start the payment");

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Shukarsh",
        description: "Order payment",
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          // Razorpay's window has closed by now and the pay button already
          // stopped loading, so without this the customer watches an idle
          // checkout page while we confirm, with no sign anything happened.
          setConfirming(true);

          try {
            const verified = await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            sessionStorage.setItem(ORDER_PLACED_KEY, verified.orderId);
            router.push("/checkout/success");
          } catch (verifyError) {
            setConfirming(false);
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
    if (unserviceable) return <dd className="font-semibold text-rose-500">Not serviceable</dd>;
    if (deliveryFree) return <dd className="font-semibold text-mint-400">Free</dd>;
    return <dd className="font-semibold text-ink">{formatPrice(deliveryFee)}</dd>;
  };

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[24rem] opacity-60" />

      {confirming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 grid place-items-center bg-canvas/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 rounded-4xl bg-surface/95 px-10 py-8 text-center shadow-lift hairline">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-lavender-200 border-t-lavender-500" />
            <span className="text-sm font-semibold text-ink">Confirming your payment</span>
            <span className="max-w-[16rem] text-xs leading-relaxed text-muted">
              Your money has gone through. Please do not close this tab while we write the order down.
            </span>
          </div>
        </motion.div>
      )}

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
              variants={staggerParent(0.08)}
              initial="hidden"
              animate="show"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <motion.div
                variants={fadeUp}
                className="space-y-4 rounded-4xl bg-surface/90 p-6 shadow-soft sm:p-8 hairline"
              >
                <h2 className="font-display text-xl text-ink">Where should it go?</h2>

                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>

                <input
                  required
                  minLength={5}
                  aria-label="Address"
                  placeholder="Flat / house no, street"
                  autoComplete="address-line1"
                  className={fieldClass}
                  value={form.line1}
                  onChange={(event) => setForm({ ...form, line1: event.target.value })}
                />

                <input
                  aria-label="Address line 2"
                  placeholder="Area, landmark (optional)"
                  autoComplete="address-line2"
                  className={fieldClass}
                  value={form.line2}
                  onChange={(event) => setForm({ ...form, line2: event.target.value })}
                />

                <div className="grid gap-3 sm:grid-cols-3">
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
                </div>

                <input
                  required
                  type="email"
                  aria-label="Email"
                  placeholder="Email for your receipt"
                  autoComplete="email"
                  className={fieldClass}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </motion.div>

              <motion.section
                variants={fadeUp}
                className="rounded-4xl bg-surface/90 p-6 shadow-soft sm:p-8 hairline"
                aria-label="Delivery options"
              >
                <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                  <Truck className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                  When will it arrive?
                </h2>

                {!pincodeReady ? (
                  <p className="mt-4 flex items-start gap-2.5 rounded-3xl bg-lavender-50 px-4 py-3.5 text-sm text-ink-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.4} />
                    Enter your PIN code above and we will tell you how long it takes to reach you.
                  </p>
                ) : deliveryLoading ? (
                  <div className="mt-5" role="status" aria-label="Checking delivery">
                    <Skeleton className="h-16 w-full rounded-3xl" />
                  </div>
                ) : unserviceable ? (
                  <div className="mt-4 flex items-start gap-2.5 rounded-3xl bg-rose-50 px-4 py-3.5 text-sm text-rose-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
                    <span>
                      No courier is delivering to {form.zip} right now. Try a different PIN code and we will
                      re-check instantly.
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-start gap-2.5 rounded-3xl bg-mint-100/70 px-4 py-3.5 text-sm text-ink-700">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" strokeWidth={2.4} />
                    <span>
                      {deliveryFree ? "Delivery is on us." : `Delivery is ${formatPrice(deliveryFee)}.`}{" "}
                      {etaDays
                        ? `Expect it in about ${etaDays} day${etaDays === 1 ? "" : "s"}.`
                        : "We will confirm the timing when it is dispatched."}
                    </span>
                  </div>
                )}
              </motion.section>

              <motion.section
                variants={fadeUp}
                className="rounded-4xl bg-surface/90 p-6 shadow-soft sm:p-8 hairline"
                aria-label="How you want to pay"
              >
                <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                  <Wallet className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                  How would you like to pay?
                </h2>

                <div className="mt-4 space-y-3">
                  <PayOption
                    checked={!payingCash}
                    onSelect={() => setPayMethod("PREPAID")}
                    title="Pay now"
                    detail="UPI, cards, wallets or net banking, through Razorpay."
                  />
                  {/* Only once the server has said it takes cash and at what
                      price. Offering it on a guess would let someone choose cash
                      and have the order placed as unpaid card instead. */}
                  {cod?.enabled && (
                    <PayOption
                      checked={payingCash}
                      onSelect={() => setPayMethod("COD")}
                      disabled={codRefused !== null && payMethod !== "COD"}
                      title="Cash on delivery"
                      detail={
                        codRefused ??
                        `Pay the courier when it arrives. Adds ${formatPrice(
                          codFee || cod.fee
                        )} to cover collection.`
                      }
                      tone={codRefused ? "muted" : "default"}
                    />
                  )}
                </div>

                {codRefused && payMethod === "COD" && (
                  <p className="mt-3 text-xs text-rose-500" role="status">
                    {codRefused} Pay now to place this order.
                  </p>
                )}
              </motion.section>

              <motion.div variants={fadeUp}>
                <Button type="submit" loading={loading} size="lg" className="w-full" disabled={unserviceable}>
                  <CreditCard className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.3} />
                  {loading
                    ? payingCash
                      ? "Placing your order"
                      : "Opening Razorpay"
                    : payingCash
                      ? `Place order · ${formatPrice(displayTotal)} on delivery`
                      : `Pay ${formatPrice(displayTotal)}`}
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
                  {payingCash
                    ? "Keep the exact amount ready. The courier collects it at your door."
                    : "Cards, UPI, wallets and net banking, all handled by Razorpay."}
                </p>
                {/* One click from the pay button, which is where the rules want it. */}
                <p className="mt-2 text-center text-xs leading-relaxed text-faint">
                  Paying means you agree to our{" "}
                  <Link href="/terms" className="font-semibold text-muted underline decoration-lavender-300 underline-offset-2">
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/refunds" className="font-semibold text-muted underline decoration-lavender-300 underline-offset-2">
                    returns policy
                  </Link>
                  .
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

              <div className="mt-5 border-t border-line pt-4">
                <label htmlFor="coupon" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Have a code?
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="coupon"
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyCode();
                      }
                    }}
                    placeholder="WELCOME10"
                    autoCapitalize="characters"
                    autoComplete="off"
                    disabled={Boolean(appliedCoupon)}
                    className="h-11 min-w-0 flex-1 rounded-2xl border-0 bg-surface px-4 text-sm font-semibold uppercase tracking-wide text-ink shadow-soft ring-1 ring-line transition-shadow placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-faint focus:ring-2 focus:ring-lavender-400 disabled:opacity-60"
                  />
                  {/*
                    Clearing has to be offered for a code that was refused too,
                    not just one that worked, or a rejected code sits in the
                    quote with no way to take it back out.
                  */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={couponCode ? removeCode : applyCode}
                    loading={couponPending}
                    disabled={!couponCode && !couponInput.trim()}
                    className="shrink-0"
                  >
                    {couponCode ? "Remove" : "Apply"}
                  </Button>
                </div>

                {appliedCoupon && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-mint-400">
                    <BadgePercent className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
                    <span className="text-ink-700">
                      {appliedCoupon.code} applied
                      {appliedCoupon.description ? ` · ${appliedCoupon.description}` : ""}
                    </span>
                  </p>
                )}

                {couponError && (
                  <p className="mt-2 text-xs text-rose-500" role="status">
                    {couponError}
                  </p>
                )}
              </div>

              <dl
                aria-busy={pricedStale}
                className={cn(
                  "mt-5 space-y-2 border-t border-line pt-4 text-sm transition-opacity",
                  pricedStale && "opacity-50"
                )}
              >
                <div className="flex justify-between text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-ink">{formatPrice(totalPrice)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-mint-400">
                    <dt>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ""}</dt>
                    <dd className="font-semibold">−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <dt>Delivery</dt>
                  {appliedCoupon?.freeShipping ? (
                    <dd className="font-semibold text-mint-400">Free</dd>
                  ) : (
                    shippingLabel()
                  )}
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between text-muted">
                    <dt>Cash collection</dt>
                    <dd className="font-semibold text-ink">{formatPrice(codFee)}</dd>
                  </div>
                )}
                {etaDays !== null && !unserviceable && (
                  <p className="text-xs text-faint">
                    Arrives in about {etaDays} day{etaDays === 1 ? "" : "s"}
                  </p>
                )}
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="font-display text-lg text-ink">Total</dt>
                  <dd className="text-xl font-bold text-ink">{formatPrice(displayTotal)}</dd>
                </div>
                {showTax && (
                  <p className="text-xs text-faint">
                    Includes GST {formatPrice(tax.total)}
                    {tax.igst > 0
                      ? " (IGST)"
                      : ` (CGST ${formatPrice(tax.cgst)} + SGST ${formatPrice(tax.sgst)})`}
                  </p>
                )}
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
