"use client";

import Link from "next/link";
import { useCallback, useState, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "outline" | "dark";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-tight transition-[box-shadow,background-color,color,opacity] duration-200 ease-[var(--ease-soft)] disabled:pointer-events-none disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-lavender-500 via-lavender-500 to-blush-400 text-white shadow-soft hover:shadow-glow",
  secondary: "bg-surface text-ink shadow-soft ring-1 ring-line hover:ring-lavender-300",
  soft: "bg-lavender-100 text-lavender-700 hover:bg-lavender-200",
  ghost: "text-muted hover:bg-lavender-50 hover:text-ink",
  outline: "ring-1 ring-line-strong text-ink hover:ring-lavender-400 hover:text-lavender-700",
  dark: "bg-ink-900 text-white shadow-soft hover:bg-ink-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  icon: "h-11 w-11",
  "icon-sm": "h-9 w-9",
};

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** Material-style ripple, kept on the compositor via scale/opacity only. */
function useRipple(enabled: boolean) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const spawn = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple: Ripple = {
        id: Date.now() + Math.random(),
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size,
      };
      setRipples((current) => [...current, ripple]);
      window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id));
      }, 620);
    },
    [enabled]
  );

  const layer = ripples.map((ripple) => (
    <motion.span
      key={ripple.id}
      aria-hidden
      className="pointer-events-none absolute -z-10 rounded-full bg-white/45"
      style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
      initial={{ scale: 0, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
  ));

  return { spawn, layer };
}

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

/** React's drag/animation handler types clash with motion's own props. */
type MotionConflicts =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "style";

export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts>;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  onPointerDown,
  ...props
}: ButtonProps) {
  const reduced = useReducedMotion();
  const { spawn, layer } = useRipple(!reduced);

  return (
    <motion.button
      {...props}
      disabled={disabled || loading}
      className={buttonStyles(variant, size, className)}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      whileHover={reduced ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onPointerDown={(event) => {
        spawn(event);
        onPointerDown?.(event);
      }}
    >
      {layer}
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {children}
    </motion.button>
  );
}

const MotionLink = motion.create(Link);

export type ButtonLinkProps = ButtonOwnProps & Omit<ComponentProps<typeof Link>, MotionConflicts>;

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  onPointerDown,
  ...props
}: ButtonLinkProps) {
  const reduced = useReducedMotion();
  const { spawn, layer } = useRipple(!reduced);

  return (
    <MotionLink
      {...props}
      className={buttonStyles(variant, size, className)}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      whileHover={reduced ? undefined : { y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onPointerDown={(event) => {
        spawn(event);
        onPointerDown?.(event);
      }}
    >
      {layer}
      {children}
    </MotionLink>
  );
}
