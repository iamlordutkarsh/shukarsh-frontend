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
      <h1 className="text-2xl font-bold text-zinc-900">Orders</h1>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <p className="mt-4 text-zinc-600">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-4 text-zinc-600">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 text-sm font-mono text-zinc-900">{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-900">{order.status}</td>
                  <td className="px-6 py-4 text-sm text-zinc-900">{order.paymentStatus}</td>
                  <td className="px-6 py-4 text-sm text-zinc-900">₹{Number(order.totalAmount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
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
