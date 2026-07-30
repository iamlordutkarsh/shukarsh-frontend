import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Para, PolicyPage, Section } from "../../components/legal/PolicyPage";
import { openGraphFor } from "../../lib/seo";
import { SHOP, detail } from "../../lib/shop";

const TITLE = "Terms and conditions";
const INTRO = "The agreement between you and us when you buy something here.";

export const metadata: Metadata = {
  title: TITLE,
  description: "The terms you agree to when ordering from Shukarsh.",
  alternates: { canonical: "/terms" },
  openGraph: openGraphFor({ path: "/terms", title: TITLE, description: INTRO }),
};

export default function TermsPage() {
  return (
    <PolicyPage title={TITLE} intro={INTRO}>
      <Section title="Who you are buying from">
        <Para>
          This shop is run by {detail(SHOP.legalName)}
          {SHOP.entityType.trim() ? `, ${SHOP.entityType.toLowerCase()}` : ""}. Our full address and
          phone number are on the{" "}
          <Link href="/contact" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            contact page
          </Link>
          . Placing an order means you accept what is on this page.
        </Para>
      </Section>

      <Section title="Prices">
        <Bullets
          items={[
            "Every price is in Indian rupees.",
            "GST is already included in the price you see. There is no tax added at the end.",
            "Delivery, where it applies, is shown on the bag before you pay. Nothing else is added after that.",
          ]}
        />
        <Para>
          The price you pay is the one shown when you place the order, even if it changes afterwards.
        </Para>
      </Section>

      <Section title="When an order becomes an order">
        <Para>
          Choosing something and paying for it is an offer to buy. The order is accepted once the
          payment clears and we send the confirmation email. Until then nothing is reserved.
        </Para>
        <Para>
          Very occasionally we have to refuse an order: the last one sells twice within the same
          minute, a price is plainly wrong, or the address cannot be delivered to. If that happens we
          cancel it and refund the whole amount, and we tell you why.
        </Para>
      </Section>

      <Section title="Stock and descriptions">
        <Para>
          We photograph and describe everything as accurately as we can. Screens vary, so colours can
          look slightly different from one to the next, and handmade or small-batch pieces vary a
          little between items. That variation is not a fault.
        </Para>
      </Section>

      <Section title="Coupons">
        <Bullets
          items={[
            "One coupon per order unless a coupon says otherwise.",
            "Coupons have no cash value and cannot be exchanged for money.",
            "Where a coupon is limited to one use per person, we count that per account and per email address.",
            "We can withdraw a coupon that is being abused.",
          ]}
        />
      </Section>

      <Section title="Delivery and returns">
        <Para>
          Delivery is covered by the{" "}
          <Link href="/shipping" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            delivery policy
          </Link>
          , and returns, cancellations and refunds by the{" "}
          <Link href="/refunds" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            returns policy
          </Link>
          . Both form part of these terms.
        </Para>
      </Section>

      <Section title="Your account">
        <Para>
          Keep your password to yourself, and tell us if you think somebody else has it. You are
          responsible for orders placed from your account. We can close an account being used
          fraudulently.
        </Para>
      </Section>

      <Section title="What we are responsible for">
        <Para>
          We are responsible for getting you what you ordered, in the condition it should arrive in.
          If we fail at that, you get a replacement or your money back.
        </Para>
        <Para>
          We are not responsible for losses beyond that, such as time lost or a plan that depended on a
          parcel arriving by a particular day, except where Indian law says we are. Nothing here takes
          away rights the Consumer Protection Act gives you.
        </Para>
      </Section>

      <Section title="Complaints">
        <Para>
          Write to {detail(SHOP.email)} first, because most things are settled in a single email. If
          that does not resolve it, our grievance officer is named on the{" "}
          <Link href="/contact" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            contact page
          </Link>
          . We acknowledge complaints within 48 hours and settle them within a month.
        </Para>
      </Section>

      <Section title="Governing law">
        <Para>
          These terms are governed by Indian law, and disputes go to the courts of{" "}
          {detail(SHOP.jurisdiction)}.
        </Para>
      </Section>
    </PolicyPage>
  );
}
