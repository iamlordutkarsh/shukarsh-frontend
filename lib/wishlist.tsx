"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createLocalStore } from "./local-store";
import type { Product } from "./types";
import { useHydrated } from "./use-hydrated";

interface WishlistContextValue {
  items: Product[];
  ids: Set<string>;
  has: (productId: string) => boolean;
  toggle: (product: Product) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  ready: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const EMPTY: Product[] = [];
const store = createLocalStore<Product[]>("shukarsh-wishlist", EMPTY);

/**
 * Local-first wishlist. The shape mirrors the planned /api/wishlist payload so
 * switching to the server store stays a drop-in change.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const ready = useHydrated();

  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  /** Returns true when the product ended up saved. */
  const toggle = useCallback((product: Product) => {
    const saved = !store.getSnapshot().some((item) => item.id === product.id);
    store.set((current) =>
      saved ? [product, ...current] : current.filter((item) => item.id !== product.id)
    );
    return saved;
  }, []);

  const remove = useCallback((productId: string) => {
    store.set((current) => current.filter((item) => item.id !== productId));
  }, []);

  const clear = useCallback(() => store.set(EMPTY), []);

  const value = useMemo(
    () => ({ items, ids, has, toggle, remove, clear, count: items.length, ready }),
    [items, ids, has, toggle, remove, clear, ready]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
