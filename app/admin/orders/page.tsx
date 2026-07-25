"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { useAuth } from "../../../lib/auth";
import { getOrders } from "../../../lib/api";
import { Order } from "../../../lib/types";

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    getOrders(token)
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Orders</h1>

      {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="mt-4 text-[var(--text-muted)]">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-[var(--text-muted)]">No orders yet.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Order ID</th>
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
    </AdminLayout>
  );
}
