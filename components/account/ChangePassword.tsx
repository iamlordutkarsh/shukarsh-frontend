"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

const fieldClass =
  "w-full rounded-2xl border-0 bg-surface px-4 py-2.5 text-sm text-ink ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePassword() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    // Caught here rather than at the server, which never sees the second copy.
    if (form.newPassword !== form.confirmPassword) {
      setError("The two new passwords do not match");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await changePassword(token, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY);
      setOpen(false);
      toast({ title: "Password changed", description: "Use the new one next time you sign in.", tone: "success" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not change your password");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 text-sm font-semibold text-ink-700 transition-colors hover:text-ink"
      >
        <span className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
          Change password
        </span>
        <span aria-hidden className="text-faint">
          →
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <p className="flex items-center gap-2.5 text-sm font-semibold text-ink">
        <KeyRound className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
        Change password
      </p>

      <input
        required
        type="password"
        autoComplete="current-password"
        aria-label="Current password"
        placeholder="Current password"
        className={fieldClass}
        value={form.currentPassword}
        onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
      />
      <input
        required
        minLength={6}
        type="password"
        autoComplete="new-password"
        aria-label="New password"
        placeholder="New password, at least 6 characters"
        className={fieldClass}
        value={form.newPassword}
        onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
      />
      <input
        required
        minLength={6}
        type="password"
        autoComplete="new-password"
        aria-label="Confirm new password"
        placeholder="Repeat the new password"
        className={fieldClass}
        value={form.confirmPassword}
        onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
      />

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" loading={saving} className="flex-1">
          Save password
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setForm(EMPTY);
            setError("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
