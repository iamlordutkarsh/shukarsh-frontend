import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Payment cancelled</h1>
        <p className="mt-4 text-zinc-600">
          Your payment was cancelled. Your cart items are still saved if you would like to try again.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/checkout"
            className="rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Try Again
          </Link>
          <Link
            href="/products"
            className="rounded-md border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
