export const dynamic = "force-dynamic";

import AdminLayout from "../../components/AdminLayout";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { getCategories, getProducts } from "../../lib/api";
import { isLowStock } from "../../lib/inventory";

export default async function AdminDashboardPage() {
  const [{ categories }, { products, pagination }] = await Promise.all([
    getCategories(),
    getProducts({ limit: 100, sort: "newest" }),
  ]);

  const lowStock = products.filter(isLowStock).slice(0, 6);

  return (
    <AdminLayout title="Dashboard" subtitle="A calm overview of the shop: what is in stock, what is selling, what needs love.">
      <AdminDashboard productTotal={pagination.total} categoryTotal={categories.length} lowStock={lowStock} />
    </AdminLayout>
  );
}
