/**
 * WhatsApp is the whole support desk, so every entry point builds its link here:
 * one number to change, and one place that decides what to do when it is not set.
 */
const RAW = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

/** wa.me takes digits only, so a number written as +91 98765 43210 still works. */
const DIGITS = RAW.replace(/\D/g, "");

/**
 * wa.me needs the country code, and rejects the number outright without it: a
 * bare 7668792739 opens WhatsApp on "the phone number shared via url is
 * invalid", which looks like the shop's fault to the customer and gives no clue
 * to whoever set the variable.
 *
 * Ten digits starting 6 to 9 is an Indian mobile and nothing else, and this shop
 * only ships within India, so the code can be added rather than demanded.
 */
const NUMBER = /^[6-9]\d{9}$/.test(DIGITS) ? `91${DIGITS}` : DIGITS;

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
