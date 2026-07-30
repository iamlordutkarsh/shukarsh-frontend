import { AlertTriangle } from "lucide-react";
import { FloatingDecor } from "../motion/FloatingDecor";
import { missingShopDetails } from "../../lib/shop";

/**
 * Warns that the shop's own details are still blank.
 *
 * Shown to everybody, including customers, on purpose. These pages are the ones a
 * payment aggregator reads before it will release money, so a gap needs to be
 * embarrassing enough to get filled rather than tucked away in a log nobody opens.
 */
function MissingDetails() {
  const missing = missingShopDetails();
  if (missing.length === 0) return null;

  return (
    <div className="mt-8 rounded-3xl border border-blush-200 bg-blush-50 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <AlertTriangle className="h-4 w-4 text-blush-500" strokeWidth={2.4} />
        This page is not finished
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        The shop still has to publish {missing.length === 1 ? "one detail" : `${missing.length} details`}{" "}
        the law and our payment provider both require. Until then, please write to us and we will
        answer anything this page does not.
      </p>
      <ul className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
        {missing.map((label) => (
          <li key={label} className="flex gap-1.5">
            <span aria-hidden className="text-blush-400">
              •
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pb-24 pt-10">
      <FloatingDecor className="h-[22rem] opacity-50" />

      <div className="section-shell relative">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-hero text-balance">{title}</h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted sm:text-base">{intro}</p>

          <MissingDetails />

          <div className="mt-10 space-y-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A titled block. Policy pages are read by skimming for the relevant heading. */
export function Section({
  title,
  id,
  children,
}: {
  title: string;
  /** Set where something links straight to this section. */
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-3">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function Para({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted">{children}</p>;
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-muted">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Labelled facts, for the contact details a reviewer scans for. */
export function Facts({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-4 rounded-3xl bg-lavender-50/70 p-5 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
            {row.label}
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
