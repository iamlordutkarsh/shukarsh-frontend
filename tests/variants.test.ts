import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { totalStock } from "../lib/variants.ts";
import type { Product } from "../lib/types.ts";

/**
 * The badge and the buy button must agree.
 *
 * A product page once showed "in stock" beside a sold out button, because the
 * badge read the product's own total and the button read its cells. Whichever
 * the button obeys is the one worth printing.
 */
const product = (stock: number, variants: { stock: number; isActive: boolean }[]): Product =>
  ({ stock, variants } as unknown as Product);

describe("totalStock", () => {
  it("uses the product's own total when it has no options", () => {
    assert.equal(totalStock(product(22, [])), 22);
  });

  it("ignores a product total that disagrees with its cells", () => {
    assert.equal(
      totalStock(product(22, [{ stock: 0, isActive: true }, { stock: 0, isActive: true }])),
      0
    );
  });

  it("adds the cells up", () => {
    assert.equal(
      totalStock(product(0, [{ stock: 5, isActive: true }, { stock: 2, isActive: true }])),
      7
    );
  });

  it("leaves a withdrawn cell out of the count", () => {
    assert.equal(
      totalStock(product(99, [{ stock: 5, isActive: true }, { stock: 9, isActive: false }])),
      5
    );
  });
});
