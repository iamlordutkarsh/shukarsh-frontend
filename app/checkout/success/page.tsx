"use client";

import { ArrowRight, Mail, PackageCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fadeUp, staggerParent } from "../../../lib/motion";
import { ORDER_PLACED_KEY } from "../../../lib/constants";
import { SHOP } from "../../../lib/shop";
import { useHydrated } from "../../../lib/use-hydrated";
import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { ButtonLink } from "../../../components/ui/Button";
import { Confetti } from "../../../components/ui/Confetti";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const orderId = hydrated ? sessionStorage.getItem(ORDER_PLACED_KEY) : null;

  // Nothing here is worth congratulating someone who has not bought anything,
  // so an arrival with no verified payment behind it goes back to the shop.
  useEffect(() => {
    if (hydrated && !orderId) router.replace("/products");
  }, [hydrated, orderId, router]);

  if (!orderId) return null;

  return (
    <div className="relative overflow-hidden py-20">
      <Confetti />
      <FloatingDecor />

      <div className="section-shell relative">
        <motion.div
          variants={staggerParent(0.1, 0.15)}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-xl rounded-5xl bg-surface/90 p-8 text-center shadow-lift sm:p-12 hairline"
        >
          <motion.div variants={fadeUp} className="mx-auto grid h-20 w-20 place-items-center">
            <motion.span
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.2 }}
              className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-lavender-500 to-blush-400 text-white shadow-glow"
            >
              <PackageCheck className="h-9 w-9" strokeWidth={2.2} />
            </motion.span>
          </motion.div>

          <motion.span
            variants={fadeUp}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3.5 py-1.5 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-mint-400"
          >
            <Sparkles className="h-3 w-3" strokeWidth={2.6} />
            Payment confirmed
          </motion.span>

          <motion.h1 variants={fadeUp} className="mt-4 text-hero text-balance">
            Thank you, truly
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">
            Your order is in and we are already reaching for the tissue paper. A confirmation lands in your inbox
            in a few minutes.
          </motion.p>

          <motion.p variants={fadeUp} className="mt-3 font-mono text-xs text-faint">
            Order #{orderId.slice(0, 8)}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/profile" size="lg">
              Track my order
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </ButtonLink>
            <ButtonLink href="/products" variant="secondary" size="lg">
              Keep shopping
            </ButtonLink>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 flex items-center justify-center gap-1.5 text-xs text-faint">
            <Mail className="h-3.5 w-3.5" strokeWidth={2.4} />
            Questions? {SHOP.email}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
