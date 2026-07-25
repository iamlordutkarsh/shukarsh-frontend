"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
          Shukarsh
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/products" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Shop
          </Link>
          <Link href="/categories/kitchen" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Kitchen
          </Link>
          <Link href="/categories/clothing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Clothing
          </Link>
          <Link href="/categories/artificial-nails" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Nails
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="relative text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:inline">
                My Account
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
