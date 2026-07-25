import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Shukarsh</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Your one-stop shop for kitchen products, clothing, and artificial nails.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900">Shop</h4>
            <ul className="mt-2 space-y-2 text-sm text-zinc-600">
              <li>
                <Link href="/categories/kitchen" className="hover:text-zinc-900">
                  Kitchen
                </Link>
              </li>
              <li>
                <Link href="/categories/clothing" className="hover:text-zinc-900">
                  Clothing
                </Link>
              </li>
              <li>
                <Link href="/categories/artificial-nails" className="hover:text-zinc-900">
                  Artificial Nails
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900">Support</h4>
            <ul className="mt-2 space-y-2 text-sm text-zinc-600">
              <li>
                <Link href="/contact" className="hover:text-zinc-900">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-zinc-900">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-zinc-900">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-600">
          © {new Date().getFullYear()} Shukarsh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
