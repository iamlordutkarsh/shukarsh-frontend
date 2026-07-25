"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, Camera, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { subscribeToNewsletter } from "../../lib/api";
import { footerGroups } from "../../lib/nav";
import { Reveal } from "../motion/Reveal";
import { FloatingDecor } from "../motion/FloatingDecor";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { Logo } from "./Logo";

function NewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await subscribeToNewsletter(email);
      setEmail("");
      toast({
        tone: "success",
        title: "You are on the list",
        description: "Pastel drops and secret sales, straight to your inbox.",
      });
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not sign you up",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5 sm:flex-row">
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <div className="relative flex-1">
        <Mail
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lavender-500"
          strokeWidth={2.3}
        />
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className="h-12 w-full rounded-full border-0 bg-surface pl-11 pr-4 text-sm text-ink shadow-soft ring-1 ring-line transition-shadow placeholder:text-faint focus:ring-2 focus:ring-lavender-400"
        />
      </div>
      <Button type="submit" loading={loading} size="lg" className="h-12 shrink-0 px-7">
        Join
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
      </Button>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      <FloatingDecor className="opacity-70" />

      <div className="section-shell relative pb-10 pt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-5xl bg-gradient-to-br from-lavender-100 via-blush-50 to-peach-100 p-8 shadow-soft sm:p-12">
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-lavender-700">
                  <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                  The cute list
                </span>
                <h2 className="text-3xl leading-tight text-balance sm:text-4xl">
                  Get first dibs on every pastel drop
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-ink-700">
                  One short email when something new lands. No spam, unsubscribe any time.
                </p>
              </div>
              <NewsletterForm />
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              Small-batch kitchen, clothing and nail finds, chosen for the soft-hearted maximalist.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Shukarsh on Instagram"
                className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink-700 shadow-soft transition-all hover:-translate-y-0.5 hover:text-blush-500"
              >
                <Camera className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
              </a>
              <a
                href="mailto:hello@shukarsh.com"
                aria-label="Email Shukarsh"
                className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink-700 shadow-soft transition-all hover:-translate-y-0.5 hover:text-lavender-600"
              >
                <Mail className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
              </a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="space-y-3">
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-faint">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => {
                  const external = link.href.startsWith("mailto:") || link.href.startsWith("http");
                  return (
                    <li key={`${group.title}-${link.label}`}>
                      {external ? (
                        <a
                          href={link.href}
                          className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                          <span
                            aria-hidden
                            className="h-px w-0 bg-lavender-400 transition-all duration-300 group-hover:w-3"
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                          <span
                            aria-hidden
                            className="h-px w-0 bg-lavender-400 transition-all duration-300 group-hover:w-3"
                          />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-faint">© {new Date().getFullYear()} Shukarsh. Made with care in India.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-faint">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.3} />
              Secure payments by Razorpay
            </span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-700 shadow-soft transition-all hover:-translate-y-0.5 hover:text-lavender-600"
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
