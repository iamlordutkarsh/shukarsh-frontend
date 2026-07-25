"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Overlay = "cart" | "search" | "menu" | null;

interface UIContextValue {
  overlay: Overlay;
  open: (overlay: Exclude<Overlay, null>) => void;
  close: () => void;
  toggle: (overlay: Exclude<Overlay, null>) => void;
  isOpen: (overlay: Exclude<Overlay, null>) => boolean;
}

const UIContext = createContext<UIContextValue | null>(null);

/** Single source of truth so only one overlay can ever be open at a time. */
export function UIProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay>(null);

  const open = useCallback((next: Exclude<Overlay, null>) => setOverlay(next), []);
  const close = useCallback(() => setOverlay(null), []);
  const toggle = useCallback(
    (next: Exclude<Overlay, null>) => setOverlay((current) => (current === next ? null : next)),
    []
  );
  const isOpen = useCallback((next: Exclude<Overlay, null>) => overlay === next, [overlay]);

  const value = useMemo(() => ({ overlay, open, close, toggle, isOpen }), [overlay, open, close, toggle, isOpen]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
}
