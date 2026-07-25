export const dynamic = "force-dynamic";

import AdminLayout from "../../components/AdminLayout";
import { getCategories, getProducts } from "../../lib/api";

export default async function AdminDashboardPage() {
  const { categories } = await getCategories();
  const { products, pagination } = await getProducts({ limit: 1 });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Total Products</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{pagination.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Categories</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{categories.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Orders</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            <a href="/admin/orders" className="hover:underline">
              View Orders
            </a>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
