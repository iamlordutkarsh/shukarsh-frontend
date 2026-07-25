import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rupeeWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const rupeeExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number | string, exact = false) {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return rupeeWhole.format(0);
  const formatter = exact || amount % 1 !== 0 ? rupeeExact : rupeeWhole;
  return formatter.format(amount);
}

export function discountPercent(price: number, comparePrice?: number | null) {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round((1 - price / comparePrice) * 100);
}

export function initialsOf(firstName?: string | null, lastName?: string | null, email?: string) {
  const first = firstName?.trim()?.[0];
  const last = lastName?.trim()?.[0];
  if (first || last) return `${first ?? ""}${last ?? ""}`.toUpperCase();
  return (email?.trim()?.[0] ?? "?").toUpperCase();
}

export function displayName(firstName?: string | null, lastName?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name.length > 0 ? name : null;
}
