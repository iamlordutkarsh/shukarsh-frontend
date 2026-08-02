/**
 * Catalog imagery comes from whatever the API has on record, which in a seeded
 * dev database is a pile of placehold.co URLs. Those have no file extension, so
 * placehold.co answers with SVG, and the Next image optimizer refuses remote SVG
 * ("image type is not allowed", HTTP 400) — every product tile renders blank.
 *
 * Asking placehold.co for PNG fixes it without turning on `dangerouslyAllowSVG`,
 * which would open remote SVG for *every* whitelisted host, uploads included.
 */

const PLACEHOLDER_HOST = "placehold.co";
const HAS_EXTENSION = /\.[a-z0-9]+$/i;

/** Normalises one image URL into something the optimizer will actually serve. */
export function imageSrc(url: string): string;
export function imageSrc(url: null | undefined): null;
export function imageSrc(url: string | null | undefined): string | null;
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes(PLACEHOLDER_HOST)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.hostname !== PLACEHOLDER_HOST || HAS_EXTENSION.test(parsed.pathname)) return url;

  parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}.png`;
  return parsed.toString();
}
