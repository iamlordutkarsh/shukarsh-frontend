"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { resetPassword } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AuthShell, authFieldClass } from "./AuthShell";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

export function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    // Checked here as well as on the server, because the token is spent the
    // moment the server sees it: submitting a typo would burn the link and send
    // them back to the inbox for another one.
    if (password !== confirm) {
      setError("Those two passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(token, password);
      authLogin(data.token, data.user);
      toast({ tone: "success", title: "Password changed", description: "You are signed in." });
      router.push("/");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not reset your password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title="That link looks incomplete"
        subtitle="The address is missing its reset code, which usually means the email client split the link across two lines."
        footer={
          <Link href="/forgot-password" className="font-semibold text-lavender-700 hover:text-lavender-600">
            Ask for a new link
          </Link>
        }
      >
        <p className="rounded-2xl bg-surface-soft px-4 py-3 text-sm leading-relaxed text-muted">
          Try opening the link from the email again, or ask for a fresh one. Reset links expire an
          hour after they are sent.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something you have not used here before. You will be signed in straight away."
      footer={
        <>
          Changed your mind?{" "}
          <Link href="/login" className="font-semibold text-lavender-700 hover:text-lavender-600">
            Back to sign in
          </Link>
        </>
      }
    >
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
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className={`${authFieldClass} pr-12`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint transition-colors hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={2.3} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={2.3} />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
            Type it again
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className={authFieldClass}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? "Saving" : "Save and sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
