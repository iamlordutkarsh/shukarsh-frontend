import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Thank you for your order!</h1>
        <p className="mt-4 text-zinc-600">
          Your payment was successful. We will process your order and send a confirmation email shortly.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-md bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
