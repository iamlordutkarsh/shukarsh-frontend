/** Must stay in sync with INDIAN_STATES in the backend's lib/address.ts. */
export const INDIAN_STATES = [
  "Andaman & Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra & Nagar Haveli & Daman & Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const stateLookup = new Map(INDIAN_STATES.map((state) => [state.toLowerCase(), state as string]));

/** Shiprocket's pincode lookup spells states its own way, so match loosely. */
export function canonicalState(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const exact = stateLookup.get(normalized);
  if (exact) return exact;

  const loose = normalized.replace(/\band\b/g, "&").replace(/[^a-z&]/g, "");
  return (
    INDIAN_STATES.find((state) => state.toLowerCase().replace(/[^a-z&]/g, "") === loose) ?? null
  );
}

/**
 * Set the moment a payment is verified, and read by the success page.
 *
 * The success screen is a bare "thank you" with no order data, so this is a
 * correctness guard rather than a security one: without it the page renders
 * "Payment confirmed" for anyone who types the URL. Session scoped, so it goes
 * when the tab does, and a refresh still works.
 */
export const ORDER_PLACED_KEY = "shukarsh-order-placed";
