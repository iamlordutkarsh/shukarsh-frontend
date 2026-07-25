"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
          Shukarsh<span className="text-[var(--primary)]">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            { href: "/products", label: "Shop" },
            { href: "/categories/kitchen", label: "Kitchen" },
            { href: "/categories/clothing", label: "Clothing" },
            { href: "/categories/artificial-nails", label: "Nails" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[var(--primary)] after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            className="group relative flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.437 5.36A1.125 1.125 0 016.395 4.5h13.23m-1.06 0l-.17 1.122m-9.59 0a12.75 12.75 0 00-1.658 3.59h17.1l-2.17-2.17m-1.523 0l-1.73 1.73" />
            </svg>
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="hidden text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] sm:inline"
              >
                My Account
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)]"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
