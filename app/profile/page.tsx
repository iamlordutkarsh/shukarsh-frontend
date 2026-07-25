"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { getOrders } from "../../lib/api";
import { Order } from "../../lib/types";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("shukarsh-token");
    if (!token) return;

    getOrders(token)
      .then((data) => setOrders(data.orders))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="py-24 text-center">
        <p className="text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">My Account</h1>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Profile</h2>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="font-medium text-[var(--text-muted)]">Email:</span>{" "}
              <span className="text-[var(--foreground)]">{user.email}</span>
            </p>
            <p>
              <span className="font-medium text-[var(--text-muted)]">Name:</span>{" "}
              <span className="text-[var(--foreground)]">
                {user.firstName || user.lastName
                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                  : "Not provided"}
              </span>
            </p>
          </div>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mt-5 inline-block rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]"
            >
              Go to Admin
            </Link>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Order History</h2>
          {ordersLoading ? (
            <p className="mt-4 text-[var(--text-muted)]">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-[var(--text-muted)]">You have not placed any orders yet.</p>
              <Link
                href="/products"
                className="mt-4 inline-block text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead className="bg-[var(--muted)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 text-sm font-mono text-[var(--foreground)]">{order.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{order.status}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{order.paymentStatus}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">₹{Number(order.totalAmount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
