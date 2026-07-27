"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, LayoutDashboard, LogOut, Mail, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrders } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Order } from "../../lib/types";
import { displayName, initialsOf } from "../../lib/utils";
import { useWishlist } from "../../lib/wishlist";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { ChangePassword } from "../../components/account/ChangePassword";
import { OrderCard } from "../../components/orders/OrderCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyCartArt } from "../../components/ui/KawaiiArt";
import { Skeleton, SkeletonText } from "../../components/ui/Skeleton";

export default function ProfilePage() {
  const { user, token, loading, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !token) return;
    let active = true;

    getOrders(token)
      .then((data) => {
        if (active) setOrders(data.orders);
      })
      .catch(() => {
        if (active) setOrders([]);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, token]);

  if (loading || !user) {
    return (
      <div className="section-shell py-16">
        <Skeleton className="h-10 w-56 rounded-full" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
          <Skeleton className="h-64 rounded-4xl" />
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-4xl" />
            <SkeletonText lines={3} />
          </div>
        </div>
      </div>
    );
  }

  const name = displayName(user.firstName, user.lastName);

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[24rem] opacity-60" />

      <div className="section-shell relative">
        <header className="max-w-2xl">
          <h1 className="text-hero text-balance">{name ? `Hi, ${name.split(" ")[0]}` : "My account"}</h1>
          <p className="mt-2 text-sm text-muted">Your details, your orders, all in one calm place.</p>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.6fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-4xl bg-surface/90 p-6 shadow-soft hairline">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lavender-500 to-blush-400 text-lg font-bold text-white shadow-soft">
                  {initialsOf(user.firstName, user.lastName, user.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg text-ink">{name ?? "Welcome"}</p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted">
                    <Mail className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                    {user.email}
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-lavender-50 px-4 py-3">
                  <dt className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-lavender-700">Orders</dt>
                  <dd className="mt-0.5 text-xl font-bold text-ink">{ordersLoading ? "—" : orders.length}</dd>
                </div>
                <div className="rounded-3xl bg-blush-50 px-4 py-3">
                  <dt className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-blush-500">Saved</dt>
                  <dd className="mt-0.5 text-xl font-bold text-ink">{wishlistCount}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-1.5">
                <Link
                  href="/wishlist"
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-blush-50 hover:text-ink"
                >
                  <Heart className="h-4 w-4 text-blush-400" strokeWidth={2.4} />
                  My wishlist
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-faint" strokeWidth={2.4} />
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-lavender-50 hover:text-ink"
                  >
                    <LayoutDashboard className="h-4 w-4 text-peach-400" strokeWidth={2.4} />
                    Admin panel
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-faint" strokeWidth={2.4} />
                  </Link>
                )}
                <div className="rounded-2xl px-3 py-2.5">
                  <ChangePassword />
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start px-3">
                  <LogOut className="h-4 w-4" strokeWidth={2.4} />
                  Sign out
                </Button>
              </div>
            </div>
          </aside>

          <section id="orders" className="space-y-4 scroll-mt-28">
            <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
              <Package className="h-5 w-5 text-lavender-500" strokeWidth={2.3} />
              Order history
            </h2>

            {ordersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-56 rounded-4xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                compact
                art={<EmptyCartArt />}
                title="No orders yet"
                description="When you place your first order it will show up here with live status."
                action={
                  <ButtonLink href="/products">
                    Start shopping
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </ButtonLink>
                }
              />
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
