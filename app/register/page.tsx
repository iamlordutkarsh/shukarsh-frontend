"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";
import { register } from "../../lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      login(data.token, data.user);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center py-14">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[var(--foreground)]">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 block w-full"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[var(--foreground)]">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 block w-full"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 block w-full"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--foreground)] py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--primary)] disabled:bg-[var(--text-muted)] disabled:shadow-none"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
