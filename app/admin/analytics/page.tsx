"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IndianRupee, Receipt, RotateCcw, ShoppingBag, TrendingUp } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { RevenueChart } from "../../../components/admin/RevenueChart";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { getAnalytics } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { AnalyticsSummary } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function Card({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof IndianRupee;
  tone: string;
}) {
  return (
    <li className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-faint">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-full", tone)}>
          <Icon className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>}
    </li>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6">
      <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [days, setDays] = useState<number>(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loaded, setLoaded] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;

    void (async () => {
      try {
        const data = await getAnalytics(token, days);
        if (active) {
          setSummary(data.summary);
          setLoaded(days);
        }
      } catch (error) {
        if (active) {
          setLoaded(days);
          toast({
            title: "Could not load the numbers",
            description: error instanceof Error ? error.message : "Please try again.",
            tone: "error",
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token, days, toast]);

  const loading = loaded !== days;

  return (
    <AdminLayout
      title="Analytics"
      subtitle="What the shop took, what it kept, and what is not moving."
      actions={
        <div className="flex rounded-full bg-surface p-1 shadow-soft hairline">
          {WINDOWS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => setDays(option.days)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                days === option.days ? "bg-ink-900 text-white" : "text-muted hover:text-ink"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      {loading || !summary ? (
        <div className="space-y-4" role="status" aria-label="Loading analytics">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-4xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-4xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              label="Revenue"
              value={formatPrice(summary.money.revenue)}
              hint={`${summary.money.orders} paid order${summary.money.orders === 1 ? "" : "s"}`}
              icon={IndianRupee}
              tone="bg-mint-100 text-mint-500"
            />
            <Card
              label="Average order"
              value={formatPrice(summary.money.averageOrder)}
              hint={`${formatPrice(summary.money.discountGiven)} given away in discounts`}
              icon={ShoppingBag}
              tone="bg-lavender-100 text-lavender-600"
            />
            <Card
              label="Gross profit"
              value={formatPrice(summary.margin.profit)}
              hint={
                summary.margin.coverage < 1
                  ? `${summary.margin.percent}% · cost known for ${percent(summary.margin.coverage)} of units`
                  : `${summary.margin.percent}% of sales net of GST`
              }
              icon={TrendingUp}
              tone="bg-blush-100 text-blush-500"
            />
            <Card
              label="GST collected"
              value={formatPrice(summary.money.gstCollected)}
              hint="Already inside the revenue above"
              icon={Receipt}
              tone="bg-peach-100 text-peach-400"
            />
          </ul>

          <Panel title={`Revenue, last ${summary.days} days`}>
            <RevenueChart data={summary.daily} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="From checkout to paid">
              <ul className="space-y-3">
                {[
                  { label: "Reached checkout", value: summary.funnel.checkoutsStarted },
                  { label: "Paid", value: summary.funnel.paid },
                ].map((step, index, all) => {
                  const widest = Math.max(all[0]!.value, 1);
                  return (
                    <li key={step.label}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink">{step.label}</span>
                        <span className="font-semibold text-ink">{step.value}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lavender-100">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            index === all.length - 1
                              ? "bg-mint-400"
                              : "bg-gradient-to-r from-lavender-400 to-blush-300"
                          )}
                          style={{ width: `${Math.max(2, (step.value / widest) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {percent(summary.funnel.abandonRate)} of checkouts were never paid for. The bag itself lives in
                the customer&apos;s browser and never reaches us, so counting starts at checkout.
              </p>
            </Panel>

            <Panel title="Best sellers">
              {summary.topProducts.length === 0 ? (
                <p className="text-sm text-muted">Nothing sold in this window.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.topProducts.map((product) => (
                    <li key={product.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <Link
                        href={`/admin/products/${product.slug}/edit`}
                        className="min-w-0 flex-1 truncate text-ink transition-colors hover:text-lavender-600"
                      >
                        {product.name}
                      </Link>
                      <span className="shrink-0 text-muted">{product.units} sold</span>
                      <span className="w-24 shrink-0 text-right font-semibold text-ink">
                        {formatPrice(product.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Not moving">
              {summary.deadStock.length === 0 ? (
                <p className="text-sm text-muted">Everything on the shelf sold at least once. Good sign.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {summary.deadStock.map((product) => (
                      <li key={product.id} className="flex items-baseline justify-between gap-3 text-sm">
                        <Link
                          href={`/admin/products/${product.slug}/edit`}
                          className="min-w-0 flex-1 truncate text-ink transition-colors hover:text-lavender-600"
                        >
                          {product.name}
                        </Link>
                        <span className="shrink-0 text-muted">{product.stock} sitting</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    In stock and not sold once in {summary.days} days. Worth a discount or a photo change
                    before reordering.
                  </p>
                </>
              )}
            </Panel>

            <Panel title="Stock and returns">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">On the shelf</dt>
                  <dd className="font-semibold text-ink">{summary.stock.onShelf} units</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Worth, at cost</dt>
                  <dd className="font-semibold text-ink">{formatPrice(summary.stock.valueAtCost)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Need reordering</dt>
                  <dd className="font-semibold text-ink">{summary.stock.lowCount}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
                  <dt className="text-muted">Came back</dt>
                  <dd className="font-semibold text-ink">
                    {summary.returns.units} units · {percent(summary.returns.rate)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Refunded</dt>
                  <dd className="font-semibold text-ink">{formatPrice(summary.money.refunded)}</dd>
                </div>
              </dl>
              {summary.returns.units > 0 && (
                <p className="mt-4 flex items-center gap-1.5 text-xs leading-relaxed text-muted">
                  <RotateCcw className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                  {summary.returns.damaged} damaged, {summary.returns.wrongItem} wrong item.
                </p>
              )}
            </Panel>
          </div>

          {summary.money.orders === 0 && (
            <EmptyState
              art={<NoResultsArt />}
              title="Nothing paid for in this window"
              description="Widen the window, or come back once the first order lands."
            />
          )}
        </div>
      )}
    </AdminLayout>
  );
}
