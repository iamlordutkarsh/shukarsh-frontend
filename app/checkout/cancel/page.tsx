import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { ButtonLink } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { OopsArt } from "../../../components/ui/KawaiiArt";

export const metadata = { title: "Payment cancelled" };

export default function CheckoutCancelPage() {
  return (
    <div className="relative py-20">
      <FloatingDecor className="opacity-60" />
      <div className="section-shell relative">
        <EmptyState
          art={<OopsArt />}
          title="Payment was cancelled"
          description="No money moved and your bag is exactly as you left it. Try again whenever you are ready."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/checkout" size="lg">
                Try again
              </ButtonLink>
              <ButtonLink href="/cart" variant="secondary" size="lg">
                Review my bag
              </ButtonLink>
            </div>
          }
          className="mx-auto max-w-xl"
        />
      </div>
    </div>
  );
}
