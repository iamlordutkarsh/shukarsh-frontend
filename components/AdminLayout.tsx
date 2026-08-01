"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  BadgePercent,
  ChartLine,
  LayoutDashboard,
  Package,
  Palette,
  RotateCcw,
  ShoppingCart,
  Star,
  Tags,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { ButtonLink } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { OopsArt } from "./ui/KawaiiArt";
import { Skeleton } from "./ui/Skeleton";
import { easeSoft } from "../lib/motion";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: ChartLine },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/colours", label: "Colours", icon: Palette },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
] as const;

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

function isCurrent(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function AdminShellSkeleton() {
  return (
    <div className="section-shell py-8 lg:py-12" role="status" aria-label="Checking admin access">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <Skeleton className="hidden h-80 rounded-4xl lg:block" />
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-full lg:hidden" />
          <Skeleton className="h-9 w-52 rounded-full" />
          <Skeleton className="h-56 w-full rounded-4xl" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) return <AdminShellSkeleton />;

  if (!isAdmin) {
    return (
      <div className="section-shell py-16 lg:py-24">
        <EmptyState
          art={<OopsArt />}
          title="This corner is admins only"
          description="Sign in with a Shukarsh admin account to manage products, categories and orders."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/login">Sign in</ButtonLink>
              <ButtonLink href="/" variant="secondary">
                Back to store
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="section-shell py-8 lg:py-12">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-4xl bg-surface/90 p-5 shadow-soft hairline">
            <Link href="/admin" className="block rounded-2xl px-2 py-1">
              <span className="block font-display text-xl tracking-tight text-ink">Shukarsh</span>
              <span className="mt-0.5 block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
                Studio admin
              </span>
            </Link>

            <nav aria-label="Admin sections" className="mt-6 space-y-1.5">
              {navItems.map((item) => {
                const active = isCurrent(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 ease-[var(--ease-soft)]",
                      active
                        ? "bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-soft"
                        : "text-muted hover:bg-lavender-50 hover:text-ink"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-line pt-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-lavender-50 hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                Back to store
              </Link>
              {user?.email && <p className="mt-3 truncate px-3.5 text-xs text-faint">{user.email}</p>}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <nav
            aria-label="Admin sections"
            className="-mx-1 flex items-center gap-1.5 overflow-x-auto rounded-full bg-surface/85 p-1.5 shadow-soft no-scrollbar hairline lg:hidden"
          >
            {navItems.map((item) => {
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[0.8125rem] font-semibold transition-colors duration-200 ease-[var(--ease-soft)]",
                    active
                      ? "bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-soft"
                      : "text-muted hover:text-ink"
                  )}
                >
                  <item.icon className="h-4 w-4" strokeWidth={2.2} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[0.8125rem] font-semibold text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              Store
            </Link>
          </nav>

          {title && (
            <header className="mt-6 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Admin</p>
                <h1 className="mt-1.5 text-section text-ink">{title}</h1>
                {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
            </header>
          )}

          <motion.main
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeSoft }}
            className="mt-7"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
