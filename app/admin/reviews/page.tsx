"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Star } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { textareaClass } from "../../../components/admin/FormField";
import { formatPlacedAt } from "../../../components/orders/status";
import { Stars } from "../../../components/product/Stars";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { getAllReviews, hideReview, unhideReview } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { AdminReview } from "../../../lib/types";
import { cn } from "../../../lib/utils";

/**
 * Moderation, and only moderation.
 *
 * There is no approval queue here on purpose. Reviews go up the moment a
 * delivered customer writes one, and the only thing this screen can do is take
 * one down with a stated reason. An approval step would mean the shop chooses
 * which opinions exist, and an average built from a chosen set is a rigged
 * number sitting next to a price.
 */
export default function AdminReviewsPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  // Stamped with which load it is, so a reload shows the skeleton again without
  // writing state on the way into the effect.
  const [loaded, setLoaded] = useState<{ key: number; reviews: AdminReview[] } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [hiding, setHiding] = useState<AdminReview | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const loading = loaded?.key !== reloadKey;
  const reviews = loaded?.reviews ?? [];

  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getAllReviews(token)
      .then((data) => {
        if (active) setLoaded({ key: reloadKey, reviews: data.reviews });
      })
      .catch((err) => {
        if (!active) return;
        setLoaded({ key: reloadKey, reviews: [] });
        toast({
          title: "Could not load reviews",
          description: err instanceof Error ? err.message : "Please try again in a moment.",
          tone: "error",
        });
      });

    return () => {
      active = false;
    };
  }, [token, reloadKey, toast]);

  const submitHide = async () => {
    if (!token || !hiding || reason.trim().length < 3) return;

    setSaving(true);
    try {
      await hideReview(token, hiding.id, reason.trim());
      toast({ title: "Taken down", description: "It is off the product page.", tone: "success" });
      setHiding(null);
      setReason("");
      reload();
    } catch (err) {
      toast({
        title: "Could not hide this review",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const restore = async (review: AdminReview) => {
    if (!token) return;

    setSaving(true);
    try {
      await unhideReview(token, review.id);
      toast({ title: "Back up", description: "It is on the product page again.", tone: "success" });
      reload();
    } catch (err) {
      toast({
        title: "Could not restore this review",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Reviews"
      subtitle="Written by customers you have delivered to. Take one down only if it is abuse."
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-4xl" />
          <Skeleton className="h-28 rounded-4xl" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          art={<NoResultsArt />}
          title="No reviews yet"
          description="Only customers a delivered order belongs to can write one, so the first will arrive after the first delivery."
        />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={cn(
                "rounded-4xl bg-surface/90 p-5 shadow-soft hairline",
                review.hiddenAt && "opacity-70"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="font-display text-lg text-ink hover:text-lavender-700"
                  >
                    {review.product.name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <Stars value={review.rating} />
                    {review.author} · {formatPlacedAt(review.createdAt)}
                  </p>
                </div>

                {review.hiddenAt ? (
                  <Button variant="secondary" size="sm" loading={saving} onClick={() => restore(review)}>
                    <Eye className="h-4 w-4" strokeWidth={2.3} />
                    Put it back
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHiding(review);
                      setReason("");
                    }}
                  >
                    <EyeOff className="h-4 w-4" strokeWidth={2.3} />
                    Take it down
                  </Button>
                )}
              </div>

              {review.comment && (
                <p className="mt-2 text-pretty text-sm leading-relaxed text-ink-700">{review.comment}</p>
              )}

              {review.hiddenAt && (
                <p className="mt-3 rounded-2xl bg-blush-50 px-3.5 py-2.5 text-xs text-ink-700">
                  Hidden {formatPlacedAt(review.hiddenAt)}
                  {review.hiddenReason ? ` · ${review.hiddenReason}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={hiding !== null}
        onClose={() => setHiding(null)}
        label="Take this review down"
        className="max-w-md"
      >
        {hiding && (
          <div className="p-6 sm:p-7">
            <h2 className="font-display text-xl text-ink">Take this one down?</h2>

            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Star className="h-4 w-4 shrink-0 fill-peach-400 text-peach-400" strokeWidth={2} />
              {hiding.rating} out of 5 on {hiding.product.name}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              It comes off the product page and out of the average. The customer is told it was taken
              down and shown your reason, so write it for them to read.
            </p>

            <p className="mt-3 text-xs leading-relaxed text-blush-500">
              For abuse, spam, or anything naming another person. Not for a low rating: hiding fair
              complaints leaves an average that misleads shoppers and loses the shop its star ratings in
              Google.
            </p>

            <label htmlFor="hide-reason" className="mt-4 block text-xs font-semibold text-muted">
              Why is it coming down?
            </label>
            <textarea
              id="hide-reason"
              rows={3}
              maxLength={200}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Abusive language. Names another customer."
              className={textareaClass}
            />

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setHiding(null)}>
                Leave it up
              </Button>
              <Button
                size="sm"
                loading={saving}
                disabled={reason.trim().length < 3}
                onClick={submitHide}
              >
                Take it down
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
