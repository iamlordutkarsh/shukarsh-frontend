import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-12 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Payment cancelled</h1>
          <p className="mt-4 text-[var(--text-muted)]">
            Your payment was cancelled. Your cart items are still saved if you would like to try again.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/checkout"
              className="rounded-lg bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary)]"
            >
              Try Again
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
