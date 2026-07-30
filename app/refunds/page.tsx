import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Facts, Para, PolicyPage, Section } from "../../components/legal/PolicyPage";
import { openGraphFor } from "../../lib/seo";
import { SHOP, detail } from "../../lib/shop";

const TITLE = "Returns, cancellations and refunds";
const INTRO =
  "What you can send back, how long you have, and exactly when the money reaches you. No discretion, no small print.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Shukarsh returns and refunds: seven days from delivery for anything damaged or wrong, refunds to the original payment method within five to seven working days.",
  alternates: { canonical: "/refunds" },
  openGraph: openGraphFor({ path: "/refunds", title: TITLE, description: INTRO }),
};

export default function RefundsPage() {
  return (
    <PolicyPage title={TITLE} intro={INTRO}>
      <Section title="The short version">
        <Facts
          rows={[
            { label: "Window to raise a return", value: "7 days from delivery" },
            { label: "Accepted reasons", value: "Damaged in transit, or the wrong item" },
            { label: "Refund reaches you in", value: "5 to 7 working days" },
            { label: "Refund goes to", value: "The card or account you paid from" },
          ]}
        />
      </Section>

      <Section title="Cancelling before it ships">
        <Para>
          Write to us at {detail(SHOP.email)} as soon as you can. If the parcel has not been handed to
          the courier we will cancel it and refund you in full, delivery included. Once it is with the
          courier we cannot pull it back, so it becomes a return instead.
        </Para>
      </Section>

      <Section title="What can be returned">
        <Para>
          You have seven days from the day your order arrives to tell us something is wrong. We accept
          returns for two reasons:
        </Para>
        <Bullets
          items={[
            "It arrived damaged.",
            "You were sent the wrong item.",
          ]}
        />
        <Para>
          We do not accept change-of-mind returns, and we would rather say that plainly than bury it.
          Press-on nails and kitchen pieces cannot be resold once the packet is open, so taking them
          back and reselling them would not be fair to whoever bought them next.
        </Para>
        <Para>
          A damage claim needs a photo. It is the only way we can tell a courier problem from a
          packing one, and it means we can take it up with the courier on your behalf instead of
          arguing with you about it.
        </Para>
      </Section>

      <Section title="How to raise one">
        <Bullets
          items={[
            <>
              Open the order from your <Link href="/profile" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">account</Link> and choose the items you are sending back.
            </>,
            "Tell us what happened, and add photos if anything is damaged.",
            "We answer with a yes or no and the reason for it, in writing.",
            "If it is a yes, we arrange the pickup from the address the order went to. You do not pay for the return leg.",
          ]}
        />
      </Section>

      <Section title="What you get back">
        <Para>
          The refund is worked out from what you actually paid, not from the ticket price. If a coupon
          reduced your order, the refund is reduced by that item&apos;s share of it, so nothing is
          double-counted in either direction. GST is refunded with the item.
        </Para>
        <Para>
          Delivery is refunded when the whole order goes back. If you keep part of it, the delivery
          charge stays with the part you kept, because it was still delivered.
        </Para>
        <Para>
          Where you would rather have the item than the money, we will send a replacement instead, as
          long as we still have one.
        </Para>
      </Section>

      <Section title="When the money arrives">
        <Para>
          We send the refund as soon as the returned parcel reaches us and we have looked at it. It
          goes back to the card, UPI ID or account the order was paid from. We cannot redirect it
          somewhere else, and that is a payment-network rule rather than ours.
        </Para>
        <Para>
          Banks take five to seven working days to show it. We email you a reference number when the
          refund is sent, and if your bank cannot find the money, that reference is what they need.
        </Para>
      </Section>

      <Section title="If we get it wrong">
        <Para>
          If a return is refused and you think that is unfair, reply to the email and it goes to our
          grievance officer, whose details are on the{" "}
          <Link href="/contact" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            contact page
          </Link>
          . We acknowledge complaints within 48 hours and settle them within a month.
        </Para>
      </Section>
    </PolicyPage>
  );
}
