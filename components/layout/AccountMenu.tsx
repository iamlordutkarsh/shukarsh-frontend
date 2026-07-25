"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Heart, LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { easeSoft } from "../../lib/motion";
import { useClickOutside } from "../../lib/use-click-outside";
import { cn, displayName, initialsOf } from "../../lib/utils";

const itemClass =
  "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink";

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  const name = user ? displayName(user.firstName, user.lastName) ?? user.email : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? "Account menu" : "Sign in"}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-all duration-300",
          user
            ? "bg-gradient-to-br from-lavender-500 to-blush-400 text-white shadow-soft hover:shadow-glow"
            : "text-ink-700 hover:bg-lavender-50 hover:text-ink"
        )}
      >
        {user ? initialsOf(user.firstName, user.lastName, user.email) : <User className="h-5 w-5" strokeWidth={2.2} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ duration: 0.26, ease: easeSoft }}
            className="absolute right-0 top-full z-10 mt-3 w-60 origin-top-right rounded-3xl bg-surface/95 p-2 shadow-lift glass-strong hairline"
          >
            {user ? (
              <>
                <div className="px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-bold text-ink">{name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-line" />
                <Link href="/profile" className={itemClass} onClick={() => setOpen(false)}>
                  <User className="h-4 w-4 text-lavender-500" strokeWidth={2.3} />
                  My account
                </Link>
                <Link href="/profile#orders" className={itemClass} onClick={() => setOpen(false)}>
                  <Package className="h-4 w-4 text-lavender-500" strokeWidth={2.3} />
                  Orders
                </Link>
                <Link href="/wishlist" className={itemClass} onClick={() => setOpen(false)}>
                  <Heart className="h-4 w-4 text-blush-400" strokeWidth={2.3} />
                  Wishlist
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className={itemClass} onClick={() => setOpen(false)}>
                    <LayoutDashboard className="h-4 w-4 text-peach-400" strokeWidth={2.3} />
                    Admin panel
                  </Link>
                )}
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className={cn(itemClass, "w-full text-left hover:bg-rose-50 hover:text-rose-600")}
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.3} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="px-3 pb-1 pt-2">
                  <p className="font-display text-base text-ink">Hi there</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    Sign in to track orders and keep your wishlist.
                  </p>
                </div>
                <div className="my-1.5 h-px bg-line" />
                <Link href="/login" className={itemClass} onClick={() => setOpen(false)}>
                  <User className="h-4 w-4 text-lavender-500" strokeWidth={2.3} />
                  Sign in
                </Link>
                <Link href="/register" className={itemClass} onClick={() => setOpen(false)}>
                  <Heart className="h-4 w-4 text-blush-400" strokeWidth={2.3} />
                  Create account
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
