"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** True only after hydration, so portals and localStorage reads stay SSR-safe. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
