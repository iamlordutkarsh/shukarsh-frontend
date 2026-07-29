import { Suspense } from "react";
import type { Metadata } from "next";
import { RecoverBag } from "../../../components/cart/RecoverBag";

export const metadata: Metadata = {
  title: "Your bag",
  // A link out of an email, pointing at one person's abandoned checkout. Nothing
  // here belongs in a search result.
  robots: { index: false, follow: false },
};

export default function RecoverCartPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-lavender-200 border-t-lavender-500" />
            <p className="text-sm text-muted">Fetching your bag…</p>
          </div>
        }
      >
        <RecoverBag />
      </Suspense>
    </main>
  );
}
