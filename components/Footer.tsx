import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Shukarsh<span className="text-[var(--primary)]">.</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Your one-stop shop for kitchen essentials, trendy clothing, and beautiful artificial nails.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/products" className="hover:text-[var(--primary)]">All Products</Link>
              </li>
              <li>
                <Link href="/categories/kitchen" className="hover:text-[var(--primary)]">Kitchen</Link>
              </li>
              <li>
                <Link href="/categories/clothing" className="hover:text-[var(--primary)]">Clothing</Link>
              </li>
              <li>
                <Link href="/categories/artificial-nails" className="hover:text-[var(--primary)]">Artificial Nails</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Account</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/login" className="hover:text-[var(--primary)]">Login</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[var(--primary)]">Register</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[var(--primary)]">My Account</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-[var(--primary)]">Cart</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/contact" className="hover:text-[var(--primary)]">Contact Us</Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[var(--primary)]">Shipping</Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[var(--primary)]">Returns</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-muted)]">
          © {new Date().getFullYear()} Shukarsh. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
