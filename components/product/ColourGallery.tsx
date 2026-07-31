"use client";

import type { ReactNode } from "react";
import { ProductGallery } from "./ProductGallery";
import { useVariantChoice } from "./VariantChoice";

/**
 * The gallery, showing whichever colour is picked.
 *
 * A thin client wrapper so the page itself stays a server component: only the
 * images change with the choice, and everything around them can still be
 * rendered on the server.
 */
export function ColourGallery({
  name,
  seed,
  badge,
}: {
  name: string;
  seed: string;
  badge?: ReactNode;
}) {
  const { images, colourId } = useVariantChoice();

  return (
    <ProductGallery
      // Remounted per colour on purpose: the gallery holds which thumbnail is
      // showing, and a shopper who was on the fourth photo of the red one should
      // land on the first photo of the blue, not its fourth.
      key={colourId ?? "default"}
      images={images}
      name={name}
      seed={seed}
      badge={badge}
    />
  );
}
