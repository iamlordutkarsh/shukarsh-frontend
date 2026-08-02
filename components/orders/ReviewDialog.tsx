"use client";

import Image from "next/image";
import { useState } from "react";
import { saveReview } from "../../lib/api";
import { imageSrc } from "../../lib/images";
import type { Review } from "../../lib/types";
import { StarPicker } from "../product/StarPicker";
import { PastelTile } from "../ui/PastelTile";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import type { ReviewTarget } from "./review-targets";

const MAX_COMMENT = 1200;

/**
 * Reviewing without leaving the order.
 *
 * Opening a product page per item is a chore on a three line order and absurd on
 * a forty line one, and it is the reason most of these never get written. The
 * order already proves the purchase, so the whole thing is a rating, a box and a
 * button.
 *
 * Mounted with a key of the product id by the caller, so moving to the next item
 * remounts it and the fields start from that item's own review rather than being
 * reset field by field on the way through an effect.
 */
export function ReviewDialog({
  open,
  target,
  existing,
  token,
  remaining,
  onClose,
  onSaved,
  onNext,
}: {
  open: boolean;
  target: ReviewTarget;
  existing: Review | null;
  token: string;
  /** Unreviewed items left in this order after this one. */
  remaining: number;
  onClose: () => void;
  onSaved: (review: Review) => void;
  onNext: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (andNext: boolean) => {
    if (rating < 1) return;

    setSaving(true);
    setError("");

    try {
      const { review } = await saveReview(token, {
        productId: target.productId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSaved(review);
      if (andNext) onNext();
      else onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={`Review ${target.name}`} className="max-w-md">
      <div className="p-6 sm:p-7">
        <div className="flex items-center gap-3.5">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
            {target.image ? (
              <Image src={imageSrc(target.image)} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <PastelTile seed={target.productId} />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg text-ink">{target.name}</h2>
            <p className="text-xs text-muted">{existing ? "Change your review" : "How was it?"}</p>
          </div>
        </div>

        <div className="mt-5">
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <label htmlFor="dialog-comment" className="mt-4 block text-xs font-semibold text-muted">
          Anything you would tell a friend about it? (optional)
        </label>
        <textarea
          id="dialog-comment"
          rows={4}
          maxLength={MAX_COMMENT}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="How it feels, how it arrived, whether you would buy it again."
          className="mt-1.5 w-full resize-y rounded-2xl border-0 bg-surface px-3.5 py-2.5 text-sm text-ink ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-lavender-400"
        />

        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Close
          </Button>

          {/* The whole point of the popup: an order of several things is one
              pass, not one page load per item. */}
          {remaining > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              disabled={rating < 1}
              onClick={() => submit(true)}
            >
              Save and next ({remaining} left)
            </Button>
          )}

          <Button size="sm" loading={saving} disabled={rating < 1} onClick={() => submit(false)}>
            {existing ? "Save changes" : "Post review"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
