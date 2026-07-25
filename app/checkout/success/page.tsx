import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-12 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Thank you for your order!</h1>
          <p className="mt-4 text-[var(--text-muted)]">
            Your payment was successful. We will process your order and send a confirmation email shortly.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-lg bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary)]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
