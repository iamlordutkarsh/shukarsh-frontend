"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { addToWishlist, getWishlist, mergeWishlist, removeFromWishlist } from "./api";
import { useAuth } from "./auth";
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
  synced: boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const EMPTY: Product[] = [];
const store = createLocalStore<Product[]>("shukarsh-wishlist", EMPTY);

interface ServerCache {
  token: string;
  items: Product[];
}

/**
 * Guests keep a local wishlist; signing in folds it into the account and the
 * server list becomes the source of truth from then on.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const guestItems = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useHydrated();
  const [cache, setCache] = useState<ServerCache | null>(null);

  const synced = Boolean(token) && cache?.token === token;
  const items = synced ? cache!.items : guestItems;

  useEffect(() => {
    if (!token) return;
    let active = true;

    void (async () => {
      const pending = store.getSnapshot().map((item) => item.id);

      try {
        const { products } =
          pending.length > 0 ? await mergeWishlist(token, pending) : await getWishlist(token);

        if (!active) return;
        store.set(EMPTY);
        setCache({ token, items: products });
      } catch {
        if (active) setCache({ token, items: store.getSnapshot() });
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  /** Returns true when the product ended up saved. */
  const toggle = useCallback(
    (product: Product) => {
      const saved = !items.some((item) => item.id === product.id);
      const next = saved ? [product, ...items] : items.filter((item) => item.id !== product.id);

      if (!token || !synced) {
        store.set(next);
        return saved;
      }

      setCache({ token, items: next });
      void (saved ? addToWishlist(token, product.id) : removeFromWishlist(token, product.id))
        .then((data) => setCache({ token, items: data.products }))
        .catch(() => setCache({ token, items }));

      return saved;
    },
    [items, synced, token]
  );

  const remove = useCallback(
    (productId: string) => {
      const next = items.filter((item) => item.id !== productId);

      if (!token || !synced) {
        store.set(next);
        return;
      }

      setCache({ token, items: next });
      void removeFromWishlist(token, productId)
        .then((data) => setCache({ token, items: data.products }))
        .catch(() => setCache({ token, items }));
    },
    [items, synced, token]
  );

  const clear = useCallback(() => {
    if (!token || !synced) {
      store.set(EMPTY);
      return;
    }

    const previous = items;
    setCache({ token, items: EMPTY });
    void Promise.all(previous.map((item) => removeFromWishlist(token, item.id))).catch(() =>
      setCache({ token, items: previous })
    );
  }, [items, synced, token]);

  const value = useMemo(
    () => ({
      items,
      ids,
      has,
      toggle,
      remove,
      clear,
      count: items.length,
      ready: hydrated && (!token || synced),
      synced,
    }),
    [items, ids, has, toggle, remove, clear, hydrated, token, synced]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
