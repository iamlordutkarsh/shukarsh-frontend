"use client";

/**
 * localStorage treated as the external store, so components subscribe instead
 * of hydrating through an effect. Snapshots are cached by their raw JSON so
 * useSyncExternalStore keeps a stable reference between reads.
 */
export interface LocalStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (updater: T | ((current: T) => T)) => void;
}

export function createLocalStore<T>(key: string, fallback: T): LocalStore<T> {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const emit = () => listeners.forEach((listener) => listener());

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    if (raw === null) {
      cachedValue = fallback;
      return cachedValue;
    }
    try {
      cachedValue = JSON.parse(raw) as T;
    } catch {
      cachedValue = fallback;
    }
    return cachedValue;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) emit();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    set(updater) {
      const current = read();
      const next = typeof updater === "function" ? (updater as (value: T) => T)(current) : updater;
      cachedRaw = JSON.stringify(next);
      cachedValue = next;
      window.localStorage.setItem(key, cachedRaw);
      emit();
    },
  };
}
