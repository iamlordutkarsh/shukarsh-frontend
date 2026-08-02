"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { login } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AuthShell, authFieldClass } from "../../components/auth/AuthShell";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);
      authLogin(data.token, data.user);
      toast({ tone: "success", title: "Welcome back", description: data.user.email });
      router.push("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-lavender-700 hover:text-lavender-600">
            Create an account
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

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.14em] text-faint">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-lavender-700 transition-colors hover:text-lavender-600"
            >
              Forgot it?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
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

        <Button type="submit" loading={loading} size="lg" className="w-full">
          {loading ? "Signing in" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
