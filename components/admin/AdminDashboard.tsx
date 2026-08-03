"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, IndianRupee, Package, Plus, ShoppingCart, Tags } from "lucide-react";
import { getOrders } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { easeSoft } from "../../lib/motion";
import type { Order, Product } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { EmptyCartArt } from "../ui/KawaiiArt";
import { Pill } from "../ui/Pill";
import { Skeleton } from "../ui/Skeleton";

interface AdminDashboardProps {
  productTotal: number;
  categoryTotal: number;
  lowStock: Product[];
}

const statusTones: Record<string, "peach" | "lavender" | "blush" | "mint" | "ink"> = {
  PENDING: "peach",
  PROCESSING: "lavender",
  SHIPPED: "blush",
  DELIVERED: "mint",
  CANCELLED: "ink",
};

export function AdminDashboard({ productTotal, categoryTotal, lowStock }: AdminDashboardProps) {
  const { token } = useAuth();
  const reduced = useReducedMotion();
  const [orders, setOrders] = useState<Order[]>([]);
  /**
   * The shop's lifetime figures, counted by the database.
   *
   * These used to be worked out by summing the orders array, which was right
   * only for as long as that array was every order there had ever been. It is a
   * page now, so the sum would quietly become "revenue from the most recent
   * hundred" — a number that goes down as the shop does better.
   */
  const [totals, setTotals] = useState<{ count: number; paidRevenue: number } | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersFailed, setOrdersFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getOrders(token)
      .then((data) => {
        if (!active) return;
        setOrders(data.orders);
        setTotals(data.totals);
      })
      .catch(() => {
        if (active) setOrdersFailed(true);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const ordersValue = ordersFailed || !totals ? "--" : String(totals.count);
  const revenueValue = ordersFailed || !totals ? "--" : formatPrice(totals.paidRevenue);

  const stats = [
    {
      label: "Products",
      value: String(productTotal),
      hint: lowStock.length > 0 ? `${lowStock.length} need restocking` : "All well stocked",
      href: "/admin/products",
      gradient: "from-lavender-200 via-lavender-100 to-blush-100",
      icon: Package,
      pending: false,
    },
    {
      label: "Categories",
      value: String(categoryTotal),
      hint: "Shelves in the shop",
      href: "/admin/categories",
      gradient: "from-blush-200 via-blush-100 to-peach-100",
      icon: Tags,
      pending: false,
    },
    {
      label: "Orders",
      value: ordersValue,
      hint: "Lifetime orders placed",
      href: "/admin/orders",
      gradient: "from-peach-200 via-peach-100 to-lavender-100",
      icon: ShoppingCart,
      pending: ordersLoading,
    },
    {
      label: "Paid revenue",
      value: revenueValue,
      hint: "Across settled payments",
      href: "/admin/orders",
      gradient: "from-mint-200 via-mint-100 to-lavender-100",
      icon: IndianRupee,
      pending: ordersLoading,
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.li
            key={stat.label}
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.07, ease: easeSoft }}
          >
            <Link
              href={stat.href}
              className="group relative block overflow-hidden rounded-4xl p-5 shadow-soft transition-shadow duration-300 ease-[var(--ease-soft)] hairline hover:shadow-lift"
            >
              <span aria-hidden className={cn("absolute inset-0 bg-gradient-to-br", stat.gradient)} />
              <span className="relative flex items-start justify-between gap-3">
                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-ink-700">
                  {stat.label}
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-surface/80 text-lavender-700 shadow-soft">
                  <stat.icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
              </span>
              <span className="relative mt-5 block">
                {stat.pending ? (
                  <Skeleton className="h-9 w-24 rounded-full" />
                ) : (
                  <span className="block font-display text-3xl tracking-tight text-ink">{stat.value}</span>
                )}
              </span>
              <span className="relative mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-700/80">
                {stat.hint}
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={2.4}
                />
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/admin/products/new">
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          Add product
        </ButtonLink>
        <ButtonLink href="/admin/categories" variant="secondary">
          <Tags className="h-4 w-4" strokeWidth={2.2} />
          Add category
        </ButtonLink>
        <ButtonLink href="/admin/orders" variant="soft">
          <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
          View orders
        </ButtonLink>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6">
          <header className="flex items-center justify-between gap-3">
            <h2 className="text-lg text-ink">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-bold uppercase tracking-[0.14em] text-lavender-700 transition-colors hover:text-lavender-600"
            >
              See all
            </Link>
          </header>

          {ordersLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-3xl" />
              ))}
            </div>
          ) : ordersFailed ? (
            <p className="mt-5 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-500">
              Orders could not be loaded right now.
            </p>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              compact
              className="mt-5"
              art={<EmptyCartArt />}
              title="No orders yet"
              description="The first order will appear here the moment it lands."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-surface-soft px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-xs font-semibold text-ink">#{order.id.slice(0, 8)}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Pill tone={statusTones[order.status] ?? "lavender"}>{order.status.toLowerCase()}</Pill>
                    <span className="text-sm font-bold text-ink">{formatPrice(order.totalAmount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6">
          <header className="flex items-center justify-between gap-3">
            <h2 className="text-lg text-ink">Needs restocking</h2>
            <Link
              href="/admin/products"
              className="text-xs font-bold uppercase tracking-[0.14em] text-lavender-700 transition-colors hover:text-lavender-600"
            >
              Manage
            </Link>
          </header>

          {lowStock.length === 0 ? (
            <p className="mt-5 rounded-3xl bg-mint-100 px-4 py-3.5 text-sm font-medium text-mint-400">
              Every product has healthy stock.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/products/${product.slug}/edit`}
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-ink transition-colors hover:text-lavender-700"
                  >
                    {product.name}
                  </Link>
                  <Pill tone={product.stock === 0 ? "blush" : "peach"}>
                    {product.stock === 0 ? "Sold out" : `${product.stock} left`}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
