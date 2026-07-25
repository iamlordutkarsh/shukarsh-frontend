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
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">My Account</h1>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Profile</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-medium text-zinc-900">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-medium text-zinc-900">Name:</span>{" "}
              {user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "Not provided"}
            </p>
            <p>
              <span className="font-medium text-zinc-900">Role:</span> {user.role.toLowerCase()}
            </p>
          </div>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Go to Admin
            </Link>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-zinc-900">Order History</h2>
          {ordersLoading ? (
            <p className="mt-4 text-zinc-600">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-zinc-600">You have not placed any orders yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">Order</th>
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
        </div>
      </div>
    </div>
  );
}
