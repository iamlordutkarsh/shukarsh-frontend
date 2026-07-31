"use client";

import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

/** The one control both the product page form and the order popup rate with. */
export function StarPicker({
  value,
  onChange,
  size = "h-7 w-7",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of five">
      {[1, 2, 3, 4, 5].map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={value === option}
          aria-label={`${option} star${option === 1 ? "" : "s"}`}
          onClick={() => onChange(option)}
          className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400"
        >
          <Star
            className={cn(size, option <= value ? "fill-peach-400 text-peach-400" : "text-lavender-200")}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}
