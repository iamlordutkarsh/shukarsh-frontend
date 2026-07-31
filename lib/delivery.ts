"use client";

import { useEffect, useState } from "react";
import { getLogisticsConfig } from "./api";

export interface DeliveryPolicy {
  freeAbove: number;
  flatFee: number;
  /**
   * Null when the shop has COD off, and also when the API is too old to say, so
   * checkout can only offer cash once the server has confirmed it takes cash.
   */
  cod: { enabled: boolean; fee: number; maxCollectable: number } | null;
}

/**
 * The shop's delivery policy, so a bag can say what delivery costs before an
 * address exists. It does not vary by pincode or by customer, so one fetch per
 * page load covers every bag on it.
 */
let cached: DeliveryPolicy | null = null;
let inFlight: Promise<DeliveryPolicy> | null = null;

function load(): Promise<DeliveryPolicy> {
  if (inFlight) return inFlight;

  inFlight = getLogisticsConfig()
    .then((config) => {
      cached = {
        freeAbove: config.freeAbove,
        flatFee: config.flatFee,
        cod: config.cod ?? null,
      };
      return cached;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Null until it arrives, which is the cue to say nothing rather than guess. */
export function useDeliveryPolicy(active = true): DeliveryPolicy | null {
  const [policy, setPolicy] = useState<DeliveryPolicy | null>(cached);

  useEffect(() => {
    if (!active || policy) return;

    let live = true;
    load()
      .then((next) => {
        if (live) setPolicy(next);
      })
      .catch(() => {});

    return () => {
      live = false;
    };
  }, [active, policy]);

  return policy;
}

/**
 * What this bag pays for delivery. Mirrors shippingFee on the server, which is
 * the one that actually charges: this only decides what the bag says.
 */
export function deliveryFor(
  subtotal: number,
  policy: DeliveryPolicy | null
): { fee: number; free: boolean; shortfall: number } | null {
  if (!policy) return null;

  const free = subtotal >= policy.freeAbove || policy.flatFee === 0;
  return {
    fee: free ? 0 : policy.flatFee,
    free,
    // Nothing to advertise when delivery is free for everyone anyway.
    shortfall: free || policy.flatFee === 0 ? 0 : Math.max(0, policy.freeAbove - subtotal),
  };
}
