"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createLocalStore } from "./local-store";
import type { Product } from "./types";

export interface CartItem {
  product: Product;
  /**
   * Absent on a bag saved before this product had sizes. The line survives, and
   * the cart page asks for a size rather than dropping something the customer
   * chose.
   */
  variantId?: string | null;
  /** Kept beside the id so a bag can be listed without refetching the product. */
  variantLabel?: string | null;
  /** The same, for the colour. Null on a product sold in sizes only. */
  variantColour?: string | null;
  quantity: number;
}

/**
 * What makes a line its own line.
 *
 * A medium and a large of one shirt are two lines, so nothing in the bag can be
 * addressed by product id alone any more.
 */
export function cartLineKey(item: { product: Product; variantId?: string | null }): string {
  return `${item.product.id}::${item.variantId ?? ""}`;
}

export interface ChosenVariant {
  id: string;
  label: string;
  colour: string | null;
}

/** What a bag line is called on screen: "Midnight blue · M". */
export function lineVariantName(item: CartItem): string | null {
  return [item.variantColour, item.variantLabel].filter(Boolean).join(" · ") || null;
}

/**
 * The bag as the API takes it.
 *
 * Shared so the delivery check, the coupon check and the order are always
 * describing the same bag. `variantId` is left out rather than sent as null
 * because the schema on the other side treats the field as optional.
 */
export function toApiItems(items: CartItem[]): { productId: string; variantId?: string; quantity: number }[] {
  return items.map((item) => ({
    productId: item.product.id,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: item.quantity,
  }));
}

/**
 * What one of this line costs.
 *
 * The snapshot in the bag may be days old and a cell may price differently from
 * its product, so this reads the cell when the bag still knows about it and
 * falls back to the product otherwise. Display only, like lineStock.
 *
 * A cell saved before cells carried prices has no `price` at all, so the
 * fallback covers a missing field as well as a missing cell: returning undefined
 * turned the bag total into NaN, which formats as ₹0 and silently priced every
 * line at nothing.
 */
export function linePrice(item: CartItem): number {
  if (!item.variantId) return item.product.price;
  const cell = item.product.variants?.find((variant) => variant.id === item.variantId);
  return cell?.price ?? item.product.price;
}

/**
 * How many of this line the shop looks like it has.
 *
 * Only ever a cap on the stepper: the bag holds a snapshot that may be days old,
 * and the real answer comes from the server when the bag is priced.
 */
export function lineStock(item: CartItem): number {
  if (!item.variantId) return item.product.stock;
  const size = item.product.variants?.find((variant) => variant.id === item.variantId);
  return size ? size.stock : item.product.stock;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: ChosenVariant | null) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  /** For a line saved before its product had sizes. */
  setLineVariant: (key: string, variant: ChosenVariant) => void;
  mergeIntoCart: (items: CartItem[]) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const EMPTY: CartItem[] = [];
const store = createLocalStore<CartItem[]>("shukarsh-cart", EMPTY);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const addToCart = useCallback((product: Product, quantity = 1, variant?: ChosenVariant | null) => {
    const line = {
      product,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label || null,
      variantColour: variant?.colour ?? null,
      quantity,
    };
    const key = cartLineKey(line);

    store.set((current) => {
      const existing = current.find((item) => cartLineKey(item) === key);
      if (existing) {
        return current.map((item) =>
          cartLineKey(item) === key ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, line];
    });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    store.set((current) => current.filter((item) => cartLineKey(item) !== key));
  }, []);

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(key);
        return;
      }
      store.set((current) =>
        current.map((item) => (cartLineKey(item) === key ? { ...item, quantity } : item))
      );
    },
    [removeFromCart]
  );

  /**
   * Merges rather than just labels: if the bag already holds the size being
   * chosen, the two become one line, because they are the same thing off the
   * same shelf and two lines would be checked against that shelf separately.
   */
  const setLineVariant = useCallback((key: string, variant: ChosenVariant) => {
    store.set((current) => {
      const line = current.find((item) => cartLineKey(item) === key);
      if (!line) return current;

      const chosen = {
        ...line,
        variantId: variant.id,
        variantLabel: variant.label || null,
        variantColour: variant.colour,
      };
      const chosenKey = cartLineKey(chosen);
      const clash = current.find((item) => item !== line && cartLineKey(item) === chosenKey);

      if (!clash) return current.map((item) => (item === line ? chosen : item));

      return current
        .filter((item) => item !== line)
        .map((item) => (item === clash ? { ...clash, quantity: clash.quantity + line.quantity } : item));
    });
  }, []);

  /**
   * Puts back anything the bag is missing, and leaves alone anything it already
   * has. Following a recovery link on the same browser that abandoned the
   * checkout would otherwise double every quantity in it.
   */
  const mergeIntoCart = useCallback((incoming: CartItem[]) => {
    store.set((current) => {
      const have = new Set(current.map(cartLineKey));
      const missing = incoming.filter((item) => !have.has(cartLineKey(item)));
      return missing.length > 0 ? [...current, ...missing] : current;
    });
  }, []);

  const clearCart = useCallback(() => store.set(EMPTY), []);

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    // Priced off the chosen cell where there is one, since a size may cost more
    // than the product it belongs to. Only ever a preview: the server prices the
    // bag again from its own rows before anybody is charged.
    const totalPrice = items.reduce((sum, item) => sum + linePrice(item) * item.quantity, 0);
    return {
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      setLineVariant,
      mergeIntoCart,
      clearCart,
      totalItems,
      totalPrice,
    };
  }, [items, addToCart, removeFromCart, updateQuantity, setLineVariant, mergeIntoCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
