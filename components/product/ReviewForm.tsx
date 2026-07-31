"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EyeOff } from "lucide-react";
import { deleteReview, getMyReview, saveReview } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Review } from "../../lib/types";
import { Button } from "../ui/Button";
import { StarPicker } from "./StarPicker";
import { Stars } from "./Stars";

const MAX_COMMENT = 1200;

/**
 * The one review this shopper is allowed to write for this product.
 *
 * Asks the API whether they are eligible before drawing anything, because a
 * form that accepts a rating and then refuses it has wasted the effort of the
 * person most likely to have written something useful.
 *
 * What they saved is rendered from the API's own response rather than by waiting
 * for the server-rendered list to catch up. The list is cached for a minute; a
 * customer looking for the words they just typed will not wait that long before
 * deciding it failed.
 */
export function ReviewForm({ productId, productName }: { productId: string; productName: string }) {
  const { token, loading: authLoading } = useAuth();
  const [state, setState] = useState<{ canReview: boolean; review: Review | null } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Signing out is handled in the render path below rather than by clearing
    // this, so nothing is written to state on the way through the effect.
    if (!token) return;

    let live = true;
    getMyReview(token, productId)
      .then((data) => {
        if (!live) return;
        setState(data);
        setRating(data.review?.rating ?? 0);
        setComment(data.review?.comment ?? "");
      })
      // A shopper who cannot be asked about eligibility is shown nothing rather
      // than a form that will fail on submit.
      .catch(() => live && setState({ canReview: false, review: null }));

    return () => {
      live = false;
    };
  }, [token, productId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || rating < 1) return;

    setSaving(true);
    setError("");

    try {
      const { review } = await saveReview(token, { productId, rating, comment: comment.trim() || undefined });
      setState((current) => ({ canReview: current?.canReview ?? true, review }));
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !state?.review) return;

    setSaving(true);
    setError("");

    try {
      await deleteReview(token, state.review.id);
      setState({ canReview: true, review: null });
      setRating(0);
      setComment("");
      setEditing(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove your review.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  if (!token) {
    return (
      <p className="mt-6 rounded-3xl bg-surface/70 px-5 py-4 text-[0.8125rem] text-muted hairline">
        <Link href="/login" className="font-bold text-lavender-600 hover:text-lavender-700">
          Sign in
        </Link>{" "}
        to review something we have sent you.
      </p>
    );
  }

  if (!state) return null;

  // Nothing delivered, nothing written: say why the form is absent rather than
  // leaving a gap where other people have one.
  if (!state.canReview && !state.review) {
    return (
      <p className="mt-6 rounded-3xl bg-surface/70 px-5 py-4 text-[0.8125rem] text-muted hairline">
        You can review {productName} once it has been delivered to you.
      </p>
    );
  }

  if (state.review && !editing) {
    const review = state.review;

    return (
      <div className="mt-6 rounded-3xl bg-lavender-50/70 px-5 py-4 hairline">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Stars value={review.rating} />
            <span className="text-[0.8125rem] font-bold text-ink">Your review</span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" loading={saving} onClick={handleDelete}>
              Remove
            </Button>
          </div>
        </div>

        {review.comment && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-700">{review.comment}</p>}

        {/* Their own review is the one place a takedown is worth saying out loud.
            Leaving it silently missing from the list would look like a bug they
            would keep trying to fix by posting it again. */}
        {review.hiddenAt && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-xs text-ink-700">
            <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blush-500" strokeWidth={2.4} />
            <span>
              We have taken this off the product page{review.hiddenReason ? `: ${review.hiddenReason}` : "."} Email us
              if you think that is wrong.
            </span>
          </p>
        )}

        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-3xl bg-surface/70 px-5 py-5 hairline">
      <fieldset disabled={saving} className="space-y-4">
        <legend className="text-[0.9375rem] font-bold text-ink">
          {state.review ? "Change your review" : `How was ${productName}?`}
        </legend>

        <StarPicker value={rating} onChange={setRating} />

        <div>
          <label htmlFor="review-comment" className="text-xs font-semibold text-muted">
            Anything you would tell a friend about it? (optional)
          </label>
          <textarea
            id="review-comment"
            rows={4}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="How it feels, how it arrived, whether you would buy it again."
            className="mt-1.5 w-full resize-y rounded-2xl border-0 bg-surface px-3.5 py-2.5 text-sm text-ink ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-lavender-400"
          />
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" loading={saving} disabled={rating < 1}>
            {state.review ? "Save changes" : "Post review"}
          </Button>

          {state.review && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setRating(state.review?.rating ?? 0);
                setComment(state.review?.comment ?? "");
                setEditing(false);
                setError("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
