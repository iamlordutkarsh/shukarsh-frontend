"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { register } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AuthShell, authFieldClass } from "../../components/auth/AuthShell";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

const MIN_PASSWORD = 8;

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const strongEnough = form.password.length >= MIN_PASSWORD;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      login(data.token, data.user);
      toast({ tone: "success", title: "Account created", description: "Welcome to Shukarsh." });
      router.push("/");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your wishlist, track orders and check out faster."
      footer={
        <>
          Already with us?{" "}
          <Link href="/login" className="font-semibold text-lavender-700 hover:text-lavender-600">
            Sign in
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
              First name
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              placeholder="Aditi"
              className={authFieldClass}
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
              Last name
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              placeholder="Sharma"
              className={authFieldClass}
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </div>
        </div>

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
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={authFieldClass}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          <p
            className={`flex items-center gap-1.5 text-xs ${strongEnough ? "text-mint-400" : "text-faint"}`}
            aria-live="polite"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
            {MIN_PASSWORD} characters or more
          </p>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? "Creating account" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
