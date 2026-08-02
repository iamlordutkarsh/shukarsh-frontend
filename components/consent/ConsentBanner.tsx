"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useSyncExternalStore } from "react";
import {
  loadPixel,
  readConsent,
  readConsentOnServer,
  subscribeConsent,
  track,
  trackingConfigured,
  writeConsent,
  type Consent,
} from "../../lib/analytics";
import { Button } from "../ui/Button";

/**
 * The only thing that can switch tracking on.
 *
 * Renders nothing at all when the shop has no pixel configured, which is the
 * default: a cookie banner on a site that sets no cookies is a nuisance that
 * teaches people to dismiss the ones that matter.
 *
 * Nothing loads until the visitor accepts. Declining is one click, the same size
 * and weight as accepting — a banner where "no" is a hidden link is not a choice
 * anybody made.
 */
export function ConsentBanner() {
  const pathname = usePathname();

  // Subscribed rather than copied into state: the server has no localStorage, so
  // the banner is never in the server markup and cannot flash at somebody who
  // answered months ago.
  const consent = useSyncExternalStore(subscribeConsent, readConsent, readConsentOnServer);

  useEffect(() => {
    if (consent !== "granted") return;
    loadPixel();
    track("PageView");
  }, [consent, pathname]);

  const decide = (answer: Consent) => writeConsent(answer);

  if (!trackingConfigured()) return null;

  return (
    <AnimatePresence>
      {consent === null && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-label="Cookie choices"
          className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-2xl rounded-4xl bg-surface/95 p-5 shadow-lift backdrop-blur-xl hairline sm:inset-x-6 sm:bottom-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lavender-100 text-lavender-600">
              <Cookie className="h-5 w-5" strokeWidth={2.2} />
            </span>

            <p className="flex-1 text-[0.8125rem] leading-relaxed text-muted">
              We would like to measure which of our posts bring people here, using Meta&apos;s pixel.
              It is off until you say yes, and the shop works exactly the same either way.{" "}
              <Link href="/privacy" className="font-semibold text-lavender-700 hover:text-lavender-600">
                Our privacy policy
              </Link>
              .
            </p>

            <div className="flex shrink-0 gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => decide("denied")}>
                No thanks
              </Button>
              <Button type="button" size="sm" onClick={() => decide("granted")}>
                That&apos;s fine
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
