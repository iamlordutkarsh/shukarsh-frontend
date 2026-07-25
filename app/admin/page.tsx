export const dynamic = "force-dynamic";

import AdminLayout from "../../components/AdminLayout";
import { getCategories, getProducts } from "../../lib/api";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { categories } = await getCategories();
  const { products, pagination } = await getProducts({ limit: 1 });

  const stats = [
    { label: "Total Products", value: pagination.total, href: "/admin/products" },
    { label: "Categories", value: categories.length, href: "/admin/categories" },
    { label: "Orders", value: "View", href: "/admin/orders" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{stat.value}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
