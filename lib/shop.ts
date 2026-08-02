/**
 * The shop's own details, as published on the policy pages.
 *
 * Razorpay checks these on the live site before it activates a merchant account,
 * and can freeze settlements if they go missing. They are also what the Consumer
 * Protection (E-Commerce) Rules require an Indian shop to show. So this is real
 * values or nothing: an empty field is treated as "not filled in yet" and the
 * page says so plainly, rather than printing something like "[YOUR ADDRESS]" that
 * reads as finished and passes neither a shopper nor a reviewer.
 *
 * Fill these in and the notices disappear on their own.
 */
export interface ShopDetails {
  /** As registered, which may not be the brand name. */
  legalName: string;
  /** "Sole proprietorship", "Private limited company", and so on. */
  entityType: string;
  /** Street, city, state and pincode. Newlines are kept. A PO box is not accepted. */
  address: string;
  /** The city whose courts terms and conditions fall under. */
  jurisdiction: string;
  phone: string;
  /** When somebody actually answers, e.g. "Monday to Saturday, 10am to 6pm IST". */
  supportHours: string;
  email: string;
  /** Optional. Shown only when set. */
  gstin: string;
  /**
   * Optional. The handle on its own, no leading @ and no URL — the shop is
   * printed as `@handle` in one place and linked in another, and storing either
   * form means building the other back out of it.
   */
  instagram: string;
  /** How long between a payment and the parcel leaving, e.g. "1 to 2 working days". */
  dispatchWindow: string;
  /** The grievance officer. For a one-person shop this is the owner. */
  grievanceName: string;
  grievanceDesignation: string;
  grievanceEmail: string;
  grievancePhone: string;
}

export const SHOP: ShopDetails = {
  legalName: "Shukarsh Enterprises",
  entityType: "Sole proprietorship",
  address: "1104 Janakpuri\nBareilly, Uttar Pradesh 243001",
  // Taken from the address above rather than chosen: the governing-law clause
  // naming a city the shop does not trade from is the kind of clause a court
  // reads against whoever drafted it.
  jurisdiction: "Bareilly",
  phone: "+91 76687 92739",
  supportHours: "Monday to Saturday, 10am to 7pm IST",
  // Already published in the site footer, so it is not a secret and not a guess.
  email: "hello@shukarsh.com",
  gstin: "09IGMPB9121F2Z9",
  instagram: "shukarsh_enterprises",
  // Matches the promise already made on every product page and in the delivery
  // policy. Two places claiming different dispatch times is the drift these
  // pages exist to prevent.
  dispatchWindow: "1 to 2 working days",
  grievanceName: "Shubhika Bartaria",
  grievanceDesignation: "Proprietor",
  // A one-person shop answers grievances on the same line it answers everything
  // else. Split these out if that ever stops being true.
  grievanceEmail: "hello@shukarsh.com",
  grievancePhone: "+91 76687 92739",
};

/**
 * Everything a payment aggregator or a customer is entitled to find. GSTIN is
 * absent on purpose: plenty of small shops are below the threshold, so demanding
 * it would raise a warning that cannot honestly be cleared.
 */
const REQUIRED: { key: keyof ShopDetails; label: string }[] = [
  { key: "legalName", label: "Registered legal name" },
  { key: "entityType", label: "Type of business" },
  { key: "address", label: "Full postal address" },
  { key: "jurisdiction", label: "City for the governing-law clause" },
  { key: "phone", label: "Support phone number" },
  { key: "supportHours", label: "Support hours" },
  { key: "email", label: "Support email" },
  { key: "dispatchWindow", label: "How long dispatch takes" },
  { key: "grievanceName", label: "Grievance officer's name" },
  { key: "grievanceDesignation", label: "Grievance officer's designation" },
  { key: "grievanceEmail", label: "Grievance officer's email" },
  { key: "grievancePhone", label: "Grievance officer's phone" },
];

export function missingShopDetails(): string[] {
  return REQUIRED.filter(({ key }) => SHOP[key].trim().length === 0).map(({ label }) => label);
}

export function shopIsConfigured(): boolean {
  return missingShopDetails().length === 0;
}

/** `@handle` for display, or null when no account is published. */
export function instagramHandle(): string | null {
  const handle = SHOP.instagram.trim().replace(/^@/, "");
  return handle ? `@${handle}` : null;
}

/**
 * The profile URL, or null. Linking a follow button at instagram.com rather than
 * at the shop drops the visitor on a login wall, which is worse than no link.
 */
export function instagramUrl(): string | null {
  const handle = SHOP.instagram.trim().replace(/^@/, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

/** The address as separate lines, so it can be laid out rather than run together. */
export function addressLines(): string[] {
  return SHOP.address
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * A value, or a marker that stands out as unfinished.
 *
 * Deliberately not blank. A policy that reads "you can call us on  " looks like a
 * rendering bug, while this reads as a job someone has not done, which is what it
 * is.
 */
export function detail(value: string): string {
  return value.trim() || "not published yet";
}
