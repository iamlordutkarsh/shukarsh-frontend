"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { useToast } from "../ui/Toast";

/**
 * Native share sheet where the device offers one, clipboard everywhere else.
 *
 * navigator.share only exists on secure origins and mostly on mobile, so the
 * copy fallback is the common path on desktop rather than an edge case.
 */
export function ShareButton({ name }: { name: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `Look at this: ${name}`, url });
        return;
      } catch {
        // Dismissing the sheet rejects, which is not worth reporting. Fall
        // through to the clipboard so the tap still does something useful.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Paste it wherever you like.", tone: "success" });
    } catch {
      toast({ title: "Could not copy the link", description: "Copy it from the address bar.", tone: "error" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Share ${name}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-xs font-bold text-muted shadow-soft transition-colors hover:text-ink"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-mint-400" strokeWidth={2.6} />
      ) : (
        <Share2 className="h-3.5 w-3.5" strokeWidth={2.4} />
      )}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
