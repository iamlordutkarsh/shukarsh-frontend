"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { OopsArt } from "../ui/KawaiiArt";
import { recoverBag } from "../../lib/api";
import { useCart } from "../../lib/cart";

/**
 * Puts an abandoned bag back and steps out of the way.
 *
 * There is nothing to read on this screen on purpose: the customer clicked a
 * button in an email that said their bag was waiting, so the only respectful
 * thing to do is have it waiting. Prices, stock and delivery are all worked out
 * again at checkout, so nothing here is a promise about what anything costs.
 */
export function RecoverBag() {
  const params = useSearchParams();
  const router = useRouter();
  const { mergeIntoCart } = useCart();
  const [failed, setFailed] = useState(false);

  const order = params.get("order");
  const token = params.get("token");
  // A link with nothing in it is already known to be broken at render, so it is
  // not something to find out about in an effect.
  const unusable = !order || !token;

  useEffect(() => {
    if (!order || !token) return;

    let active = true;

    void (async () => {
      try {
        const { items } = await recoverBag(order, token);
        if (!active) return;

        if (items.length === 0) {
          // Everything on that order has since been withdrawn from sale. Sending
          // them to an empty bag would be a shrug, so the shop floor it is.
          router.replace("/products");
          return;
        }

        mergeIntoCart(items);
        router.replace("/cart");
      } catch {
        if (active) setFailed(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [order, token, mergeIntoCart, router]);

  if (unusable || failed) {
    return (
      <EmptyState
        art={<OopsArt />}
        title="This link has expired"
        description="We could not pick that bag back up. Everything is still in the shop, though."
        action={<ButtonLink href="/products">Back to the shop</ButtonLink>}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-lavender-200 border-t-lavender-500" />
      <p className="text-sm text-muted">Fetching your bag…</p>
    </div>
  );
}
