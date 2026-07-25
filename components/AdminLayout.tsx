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
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--text-muted)]">Checking admin access...</p>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/", label: "Back to Store" },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="w-64 bg-[var(--foreground)] text-white">
        <div className="p-6">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            Shukarsh<span className="text-[var(--primary)]">.</span>
          </Link>
          <p className="mt-1 text-sm text-white/60">Admin Panel</p>
        </div>
        <nav className="space-y-1 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
