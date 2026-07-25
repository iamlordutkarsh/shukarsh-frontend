"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-600">Checking admin access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-64 bg-zinc-900 text-white">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold">
            Shukarsh
          </Link>
          <p className="mt-1 text-sm text-zinc-400">Admin Panel</p>
        </div>
        <nav className="space-y-1 px-4">
          <Link href="/admin" className="block rounded-md px-4 py-2 text-sm hover:bg-zinc-800">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block rounded-md px-4 py-2 text-sm hover:bg-zinc-800">
            Products
          </Link>
          <Link href="/admin/categories" className="block rounded-md px-4 py-2 text-sm hover:bg-zinc-800">
            Categories
          </Link>
          <Link href="/admin/orders" className="block rounded-md px-4 py-2 text-sm hover:bg-zinc-800">
            Orders
          </Link>
          <Link href="/" className="block rounded-md px-4 py-2 text-sm hover:bg-zinc-800">
            Back to Store
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
