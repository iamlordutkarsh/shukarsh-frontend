"use client";

import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { requestReturn, withdrawReturn } from "../../lib/api";
import type { Order, ReturnOutcome, ReturnReason } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { textareaClass } from "../admin/FormField";
import { returnMeta, returnOutcomeLabel, returnReasonLabel } from "./status";

const REASONS: { value: ReturnReason; label: string; hint: string }[] = [
  { value: "DAMAGED", label: "It arrived damaged", hint: "Broken, torn, leaking or marked." },
  { value: "WRONG_ITEM", label: "It is the wrong item", hint: "Not what the order says." },
];

const OUTCOMES: { value: ReturnOutcome; label: string; hint: string }[] = [
  { value: "REFUND", label: "Refund me", hint: "Back to how you paid." },
  { value: "EXCHANGE", label: "Send a replacement", hint: "Same thing, in good condition." },
];

const MIN_NOTE = 10;

export function ReturnPanel({ order, token, onChanged }: { order: Order; token: string; onChanged: () => void }) {
  const uid = useId();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReturnReason>("DAMAGED");
  const [outcome, setOutcome] = useState<ReturnOutcome>("REFUND");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const policy = order.returnWindow;
  const requests = order.returns ?? [];
  const available = policy?.available ?? {};
  const claimable = order.items.filter((item) => (available[item.id] ?? 0) > 0);
  const chosen = Object.entries(picked).filter(([, quantity]) => quantity > 0);
  const noteTooShort = note.trim().length < MIN_NOTE;

  const toggle = (orderItemId: string) => {
    setPicked((current) => {
      const next = { ...current };
      if (next[orderItemId]) delete next[orderItemId];
      else next[orderItemId] = 1;
      return next;
    });
  };

  const submit = async () => {
    if (chosen.length === 0 || noteTooShort) return;

    setSaving(true);
    try {
      await requestReturn(token, order.id, {
        reason,
        outcome,
        note: note.trim(),
        items: chosen.map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
      });
      toast({
        title: "Return requested",
        description: "We will look at it and write back, usually within a day.",
        tone: "success",
      });
      setOpen(false);
      setPicked({});
      setNote("");
      onChanged();
    } catch (error) {
      toast({
        title: "Could not open the return",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (returnId: string) => {
    setWithdrawing(returnId);
    try {
      await withdrawReturn(token, order.id, returnId);
      toast({ title: "Return withdrawn", description: "We have closed that request.", tone: "success" });
      onChanged();
    } catch (error) {
      toast({
        title: "Could not withdraw",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setWithdrawing(null);
    }
  };

  // Nothing to say: no return has ever been raised and none can be, so this
  // stays out of the way rather than explaining itself.
  if (requests.length === 0 && !policy?.open && policy?.block !== "WINDOW_CLOSED") return null;

  return (
    <section className="mt-4 rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink">
        <RotateCcw className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
        Returns
      </h2>

      {requests.length > 0 && (
        <ul className="mt-4 space-y-3">
          {requests.map((request) => {
            const meta = returnMeta[request.status] ?? returnMeta.REQUESTED;

            return (
              <li key={request.id} className="rounded-3xl bg-lavender-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em]",
                      meta!.className
                    )}
                  >
                    {meta!.label}
                  </span>
                  <span className="text-xs text-muted">
                    {returnReasonLabel[request.reason]} · {returnOutcomeLabel[request.outcome]}
                  </span>
                </div>

                <ul className="mt-2.5 space-y-1">
                  {request.items.map((item) => (
                    <li key={item.id} className="text-sm text-ink">
                      {item.product?.name ?? "Item"}
                      <span className="text-muted"> × {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                {request.adminNote && (
                  <p className="mt-2.5 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">From us: </span>
                    {request.adminNote}
                  </p>
                )}

                {request.status === "COMPLETED" && request.refundAmount != null && request.outcome === "REFUND" && (
                  <p className="mt-2 text-xs font-semibold text-mint-400">
                    {formatPrice(request.refundAmount)} refunded
                  </p>
                )}

                {request.status === "REQUESTED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-rose-500 hover:bg-rose-50"
                    loading={withdrawing === request.id}
                    onClick={() => withdraw(request.id)}
                  >
                    Withdraw this request
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {policy?.block === "WINDOW_CLOSED" && requests.length === 0 && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The return window on this order has closed. Write to us anyway if something is badly wrong.
        </p>
      )}

      {policy?.open && !open && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-muted">
            Damaged or wrong? Tell us
            {policy.closesAt
              ? ` before ${new Date(policy.closesAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}`
              : " within a week of delivery"}
            .
          </p>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Start a return
          </Button>
        </div>
      )}

      {policy?.open && open && (
        <div className="mt-4 space-y-5">
          <fieldset>
            <legend className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
              What is coming back
            </legend>
            <ul className="mt-2.5 space-y-2">
              {claimable.map((item) => {
                const max = available[item.id] ?? 0;
                const quantity = picked[item.id] ?? 0;

                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-lavender-50/60 p-3">
                    <label className="flex flex-1 items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={quantity > 0}
                        onChange={() => toggle(item.id)}
                        className="h-4 w-4 rounded border-line text-lavender-500 focus:ring-lavender-400"
                      />
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {item.product?.name ?? "Item"}
                      </span>
                    </label>
                    {quantity > 0 && max > 1 && (
                      <label className="flex items-center gap-2 text-xs text-muted">
                        How many
                        <select
                          value={quantity}
                          onChange={(event) =>
                            setPicked((current) => ({ ...current, [item.id]: Number(event.target.value) }))
                          }
                          className="h-9 rounded-xl border-0 bg-surface px-2.5 text-sm text-ink ring-1 ring-line focus:ring-2 focus:ring-lavender-400"
                        >
                          {Array.from({ length: max }, (_, index) => index + 1).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
              What went wrong
            </legend>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {REASONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-2xl p-3 ring-1 transition-shadow",
                    reason === option.value ? "ring-2 ring-lavender-400" : "ring-line hover:ring-lavender-200"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={`${uid}-reason`}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="h-4 w-4 text-lavender-500 focus:ring-lavender-400"
                    />
                    <span className="text-sm font-semibold text-ink">{option.label}</span>
                  </span>
                  <span className="mt-1 block pl-7 text-xs text-muted">{option.hint}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              These are the two we can accept. Nails and kitchen pieces cannot be resold once opened, so a
              change of mind is not covered.
            </p>
          </fieldset>

          <fieldset>
            <legend className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
              What would you like
            </legend>
            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
              {OUTCOMES.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "cursor-pointer rounded-2xl p-3 ring-1 transition-shadow",
                    outcome === option.value ? "ring-2 ring-lavender-400" : "ring-line hover:ring-lavender-200"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={`${uid}-outcome`}
                      checked={outcome === option.value}
                      onChange={() => setOutcome(option.value)}
                      className="h-4 w-4 text-lavender-500 focus:ring-lavender-400"
                    />
                    <span className="text-sm font-semibold text-ink">{option.label}</span>
                  </span>
                  <span className="mt-1 block pl-7 text-xs text-muted">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label
              htmlFor={`${uid}-note`}
              className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint"
            >
              Tell us what happened
            </label>
            <textarea
              id={`${uid}-note`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="The lid was cracked when the box arrived..."
              className={textareaClass}
            />
            <p className="text-xs text-muted">
              A sentence is plenty. It is what we look at when we decide, so the more you tell us the faster
              this goes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="dark"
              size="sm"
              loading={saving}
              disabled={chosen.length === 0 || noteTooShort}
              onClick={submit}
            >
              Send this to us
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Never mind
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
