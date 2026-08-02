import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { imageSrc } from "../lib/images.ts";

/**
 * Every product tile rendered blank against a seeded database.
 *
 * The seed's placehold.co URLs carry no file extension, so the host answers with
 * SVG, and the Next image optimizer refuses remote SVG outright — a 400 per
 * image. Asking that host for PNG is the fix; nothing else may be touched,
 * because real product photos come from storage buckets that serve fine.
 */
describe("imageSrc", () => {
  it("asks placehold.co for png when the url has no extension", () => {
    assert.equal(
      imageSrc("https://placehold.co/600x600/f3e8ff/7c3aed"),
      "https://placehold.co/600x600/f3e8ff/7c3aed.png"
    );
  });

  it("keeps the query string, which carries the label", () => {
    assert.equal(
      imageSrc("https://placehold.co/600x600/f3e8ff/7c3aed?text=Sugar"),
      "https://placehold.co/600x600/f3e8ff/7c3aed.png?text=Sugar"
    );
  });

  it("leaves a placeholder that already names a format alone", () => {
    const url = "https://placehold.co/600x600.jpg?text=Sugar";
    assert.equal(imageSrc(url), url);
  });

  it("leaves every other host alone", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/turtle";
    assert.equal(imageSrc(url), url);
  });

  it("does not rewrite a host that merely mentions placehold.co", () => {
    const url = "https://placehold.co.example.com/600x600";
    assert.equal(imageSrc(url), url);
  });

  it("passes through nothing at all, so callers can keep their fallback tile", () => {
    assert.equal(imageSrc(null), null);
    assert.equal(imageSrc(undefined), null);
    assert.equal(imageSrc(""), null);
  });
});
