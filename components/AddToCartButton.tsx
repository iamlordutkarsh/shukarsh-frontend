"use client";

import { useState } from "react";
import { Product } from "../lib/types";
import { useCart } from "../lib/cart";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex items-center">
        <label htmlFor="quantity" className="sr-only">
          Quantity
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-12 w-20 rounded-lg border border-[var(--border)] bg-white text-center text-sm font-medium focus:border-[var(--primary)] focus:outline-none"
        >
          {Array.from({ length: Math.min(10, product.stock) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleAdd}
        disabled={product.stock <= 0}
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-8 text-sm font-semibold text-white shadow-lg hover:bg-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--text-muted)] disabled:shadow-none"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
        {product.stock <= 0 ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
      </button>
    </div>
  );
}
