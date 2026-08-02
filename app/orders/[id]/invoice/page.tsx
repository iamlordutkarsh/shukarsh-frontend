import type { Metadata } from "next";
import { Invoice } from "../../../../components/orders/Invoice";

export const metadata: Metadata = {
  title: "Tax invoice",
  // One customer's bill, with their address on it. Nothing here belongs in a
  // search result.
  robots: { index: false, follow: false },
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Invoice orderId={id} />;
}
