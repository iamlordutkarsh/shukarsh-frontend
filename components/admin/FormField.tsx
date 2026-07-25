import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export const inputClass =
  "h-12 w-full rounded-2xl border-0 bg-surface px-4 text-sm text-ink shadow-none ring-1 ring-line transition-shadow duration-200 ease-[var(--ease-soft)] placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

export const textareaClass =
  "w-full rounded-2xl border-0 bg-surface px-4 py-3 text-sm leading-relaxed text-ink shadow-none ring-1 ring-line transition-shadow duration-200 ease-[var(--ease-soft)] placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

export const labelClass = "block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function FormCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-7", className)}>
      <h2 className="text-lg text-ink">{title}</h2>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
