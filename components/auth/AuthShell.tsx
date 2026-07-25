import Link from "next/link";
import { Heart, PackageCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { FloatingDecor } from "../motion/FloatingDecor";

const perks = [
  { icon: PackageCheck, label: "Track every order in one place" },
  { icon: Heart, label: "Keep your wishlist across visits" },
  { icon: Sparkles, label: "First look at every pastel drop" },
];

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative py-14">
      <FloatingDecor className="opacity-70" />

      <div className="section-shell relative">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-5xl bg-surface/90 shadow-lift lg:grid-cols-[1fr_1.1fr] hairline">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-lavender-500 via-lavender-500 to-blush-400 p-9 text-white lg:flex">
            <div
              aria-hidden
              className="absolute -right-20 -top-24 h-72 w-72 rounded-[var(--radius-blob)] bg-white/15 blur-2xl"
            />
            <div
              aria-hidden
              className="animate-float-slow absolute -bottom-24 -left-10 h-64 w-64 rounded-[var(--radius-blob)] bg-peach-200/25 blur-2xl"
            />

            <Link href="/" className="relative font-display text-2xl tracking-tight text-white">
              Shukarsh
            </Link>

            <div className="relative space-y-6">
              <p className="font-display text-3xl leading-tight text-balance">
                Little things that make life feel softer.
              </p>
              <ul className="space-y-3">
                {perks.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
                      <Icon className="h-4 w-4" strokeWidth={2.3} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="relative text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-white/70">
              Kitchen · Clothing · Nails
            </p>
          </aside>

          <div className="p-8 sm:p-10">
            <div className="space-y-1.5">
              <h1 className="text-3xl leading-tight">{title}</h1>
              <p className="text-sm text-muted">{subtitle}</p>
            </div>

            <div className="mt-7">{children}</div>

            {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export const authFieldClass =
  "h-12 w-full rounded-2xl border-0 bg-surface px-4 text-sm text-ink shadow-soft ring-1 ring-line transition-shadow placeholder:text-faint focus:ring-2 focus:ring-lavender-400";
