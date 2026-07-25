"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { useCart } from "../../lib/cart";
import { springBouncy } from "../../lib/motion";
import { primaryNav } from "../../lib/nav";
import { useUI } from "../../lib/ui-store";
import { useScrolled } from "../../lib/use-scrolled";
import { cn } from "../../lib/utils";
import { useWishlist } from "../../lib/wishlist";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";

function CountBadge({ value, tone = "primary" }: { value: number; tone?: "primary" | "accent" }) {
  const reduced = useReducedMotion();
  if (value <= 0) return null;

  return (
    <motion.span
      initial={reduced ? false : { scale: 0.4 }}
      animate={
        reduced
          ? undefined
          : { scale: [0.4, 1.35, 1], y: [0, -4, 0] }
      }
      transition={springBouncy}
      className={cn(
        "absolute -right-1 -top-1 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full px-1 text-[0.625rem] font-bold text-white shadow-soft",
        tone === "primary" ? "bg-gradient-to-br from-lavender-500 to-blush-400" : "bg-blush-400"
      )}
    >
      {value > 99 ? "99+" : value}
    </motion.span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { open } = useUI();
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const scrolled = useScrolled();
  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 160);
  };

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  const isActive = (href: string) =>
    href === "/products" ? pathname === "/products" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-90 border-b transition-[background-color,box-shadow,border-color] duration-500 ease-[var(--ease-soft)]",
        scrolled ? "border-line bg-canvas/80 shadow-soft glass-strong" : "border-transparent bg-canvas/40 glass"
      )}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMegaOpen(false);
      }}
    >
      <div
        className={cn(
          "section-shell flex items-center justify-between gap-4 transition-[height] duration-500 ease-[var(--ease-soft)]",
          scrolled ? "h-16" : "h-20"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => open("menu")}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <Logo />
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <div className="relative" onMouseEnter={() => { cancelClose(); setMegaOpen(true); }} onMouseLeave={scheduleClose}>
            <button
              type="button"
              onClick={() => setMegaOpen((current) => !current)}
              aria-expanded={megaOpen}
              className={cn(
                "group relative rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:text-ink",
                megaOpen && "text-ink"
              )}
            >
              Shop
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-4 bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-lavender-500 to-blush-400 transition-transform duration-300 ease-[var(--ease-soft)]",
                  megaOpen ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </button>

            <AnimatePresence>
              {megaOpen && (
                <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
                  <MegaMenu onNavigate={() => setMegaOpen(false)} />
                </div>
              )}
            </AnimatePresence>
          </div>

          {primaryNav.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={() => setMegaOpen(false)}
              className={cn(
                "group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isActive(item.href) ? "text-ink" : "text-ink-700 hover:text-ink"
              )}
            >
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-4 bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-lavender-500 to-blush-400 transition-transform duration-300 ease-[var(--ease-soft)]",
                  isActive(item.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => open("search")}
            aria-label="Search products"
            className="group hidden h-10 items-center gap-2 rounded-full bg-surface/70 px-3.5 text-sm text-muted shadow-soft ring-1 ring-line transition-all duration-300 hover:w-52 hover:text-ink hover:ring-lavender-300 sm:flex sm:w-40"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={2.3} />
            <span className="truncate">Search</span>
          </button>

          <button
            type="button"
            onClick={() => open("search")}
            aria-label="Search products"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink sm:hidden"
          >
            <Search className="h-5 w-5" strokeWidth={2.2} />
          </button>

          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}`}
            className="relative hidden h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-blush-50 hover:text-blush-500 sm:grid"
          >
            <Heart className="h-5 w-5" strokeWidth={2.2} />
            <CountBadge key={wishlistCount} value={wishlistCount} tone="accent" />
          </Link>

          <AccountMenu />

          <button
            type="button"
            onClick={() => open("cart")}
            aria-label={`Open bag, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
            <CountBadge key={totalItems} value={totalItems} />
          </button>
        </div>
      </div>
    </header>
  );
}
