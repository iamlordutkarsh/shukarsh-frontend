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
          className="h-11 rounded-md border border-zinc-300 px-3 text-sm focus:border-zinc-900 focus:outline-none"
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
        className="h-11 rounded-md bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {product.stock <= 0 ? "Out of Stock" : added ? "Added to Cart" : "Add to Cart"}
      </button>
    </div>
  );
}
