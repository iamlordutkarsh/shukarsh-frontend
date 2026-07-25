"use client";

import Link from "next/link";
import { ArrowRight, Heart, LayoutDashboard, LogOut, Package, Search, ShoppingBag, User } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../lib/auth";
import { fadeUp, staggerParent } from "../../lib/motion";
import { collections } from "../../lib/nav";
import { useUI } from "../../lib/ui-store";
import { useWishlist } from "../../lib/wishlist";
import { Drawer } from "../ui/Drawer";
import { PastelTile } from "../ui/PastelTile";

const rowClass =
  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink";

export function MobileMenu() {
  const { isOpen, close, open: openOverlay } = useUI();
  const { user, logout } = useAuth();
  const { count } = useWishlist();
  const open = isOpen("menu");

  return (
    <Drawer open={open} onClose={close} title="Menu" side="left" className="max-w-sm">
      <motion.div
        variants={staggerParent(0.05)}
        initial="hidden"
        animate="show"
        className="flex h-full flex-col gap-6"
      >
        <motion.button
          variants={fadeUp}
          type="button"
          onClick={() => openOverlay("search")}
          className="flex h-12 items-center gap-3 rounded-full bg-surface px-4 text-sm text-muted shadow-soft ring-1 ring-line"
        >
          <Search className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
          Search products
        </motion.button>

        <motion.div variants={fadeUp} className="space-y-2">
          <p className="px-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Collections</p>
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={`/categories/${collection.slug}`}
              onClick={close}
              className="group relative flex items-center justify-between overflow-hidden rounded-3xl p-4 shadow-soft"
            >
              <PastelTile seed={collection.slug} glyph={false} />
              <span className="relative">
                <span className="block font-display text-lg text-ink">{collection.label}</span>
                <span className="block text-xs text-ink-700">{collection.tagline}</span>
              </span>
              <ArrowRight
                className="relative h-4 w-4 text-ink-700 transition-transform group-hover:translate-x-1"
                strokeWidth={2.4}
              />
            </Link>
          ))}
          <Link href="/products" onClick={close} className={rowClass}>
            <ArrowRight className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
            Shop everything
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-1">
          <p className="px-1 pb-1 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">You</p>
          <Link href="/wishlist" onClick={close} className={rowClass}>
            <Heart className="h-4 w-4 text-blush-400" strokeWidth={2.4} />
            Wishlist
            {count > 0 && (
              <span className="ml-auto rounded-full bg-blush-100 px-2 py-0.5 text-xs font-bold text-blush-500">
                {count}
              </span>
            )}
          </Link>
          <Link href="/cart" onClick={close} className={rowClass}>
            <ShoppingBag className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
            Bag
          </Link>
          {user ? (
            <>
              <Link href="/profile" onClick={close} className={rowClass}>
                <User className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                My account
              </Link>
              <Link href="/profile#orders" onClick={close} className={rowClass}>
                <Package className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                Orders
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" onClick={close} className={rowClass}>
                  <LayoutDashboard className="h-4 w-4 text-peach-400" strokeWidth={2.4} />
                  Admin panel
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  close();
                  logout();
                }}
                className={`${rowClass} w-full text-left hover:bg-rose-50 hover:text-rose-600`}
              >
                <LogOut className="h-4 w-4" strokeWidth={2.4} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close} className={rowClass}>
                <User className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                Sign in
              </Link>
              <Link href="/register" onClick={close} className={rowClass}>
                <Heart className="h-4 w-4 text-blush-400" strokeWidth={2.4} />
                Create account
              </Link>
            </>
          )}
        </motion.div>
      </motion.div>
    </Drawer>
  );
}
