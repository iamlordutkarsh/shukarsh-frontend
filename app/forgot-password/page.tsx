"use client";

import Link from "next/link";
import { MailCheck, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { requestPasswordReset } from "../../lib/api";
import { AuthShell, authFieldClass } from "../../components/auth/AuthShell";
import { Button } from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send the reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your email" : "Forgot your password?"}
      subtitle={
        sent
          ? "If we have an account for that address, a link to choose a new password is on its way."
          : "Give us the address you signed up with and we will send you a link to choose a new one."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-lavender-700 hover:text-lavender-600">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-2xl bg-mint-100 px-4 py-3 text-sm text-ink-700">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" strokeWidth={2.4} />
            <span>
              The link works once and expires in an hour. If nothing arrives, check the spam folder
              before asking again — a second request replaces the first, so only the newest email
              will work.
            </span>
          </p>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => setSent(false)}>
            Use a different address
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
              {error}
            </motion.p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              className={authFieldClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full">
            {loading ? "Sending" : "Send me a link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
