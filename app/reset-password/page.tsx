import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPassword } from "../../components/auth/ResetPassword";

export const metadata: Metadata = {
  title: "Choose a new password",
  // A link out of an email carrying a one-time code. Nothing here belongs in a
  // search result, and a crawler following it would spend the token.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-lavender-200 border-t-lavender-500" />
          <p className="text-sm text-muted">Checking your link…</p>
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
