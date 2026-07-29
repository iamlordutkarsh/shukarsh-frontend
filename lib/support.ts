/**
 * WhatsApp is the whole support desk, so every entry point builds its link here:
 * one number to change, and one place that decides what to do when it is not set.
 */
const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

/** wa.me takes digits only, so a number written as +91 98765 43210 still works. */
const NUMBER = RAW.replace(/\D/g, "");

/**
 * A half-typed or placeholder value would render a button that opens a chat with
 * nobody, which is worse than no button, so anything short of a real number
 * counts as unset.
 */
export function supportConfigured(): boolean {
  return NUMBER.length >= 10;
}

export function whatsappLink(message?: string): string | null {
  if (!supportConfigured()) return null;

  const text = message?.trim();
  return `https://wa.me/${NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Opens with the order already named, so nobody has to ask which one. */
export function orderSupportLink(orderId: string): string | null {
  return whatsappLink(`Hi Shukarsh! I need help with order #${orderId.slice(0, 8)}.`);
}
