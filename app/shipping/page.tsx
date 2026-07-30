import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Facts, Para, PolicyPage, Section } from "../../components/legal/PolicyPage";
import { getLogisticsConfig } from "../../lib/api";
import { openGraphFor } from "../../lib/seo";
import { SHOP, detail } from "../../lib/shop";
import { formatPrice } from "../../lib/utils";

const TITLE = "Delivery";
const INTRO = "Where we deliver, what it costs, and how long it takes.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Shukarsh delivery: tracked shipping across India, with the current free-delivery threshold and dispatch times.",
  alternates: { canonical: "/shipping" },
  openGraph: openGraphFor({ path: "/shipping", title: TITLE, description: INTRO }),
};

export default async function ShippingPage() {
  // Read from the same config the checkout charges from, rather than typing a
  // figure in here. A published policy that disagrees with the till is worse than
  // a vague one, and this is the sort of number that gets changed and forgotten.
  const policy = await getLogisticsConfig().catch(() => null);

  const cost = !policy
    ? "Shown at checkout before you pay"
    : policy.flatFee === 0
      ? "Free, everywhere in India"
      : `Free on orders over ${formatPrice(policy.freeAbove)}, otherwise ${formatPrice(policy.flatFee)}`;

  return (
    <PolicyPage title={TITLE} intro={INTRO}>
      <Section title="The short version">
        <Facts
          rows={[
            { label: "Where", value: "Anywhere in India a courier will reach" },
            { label: "Cost", value: cost },
            { label: "Dispatch", value: detail(SHOP.dispatchWindow) },
            { label: "Tracking", value: "Emailed when the parcel leaves us" },
          ]}
        />
      </Section>

      <Section title="What delivery costs">
        {policy && policy.flatFee === 0 ? (
          <Para>
            Delivery is on us on every order, to every pincode. There is no minimum, and the price you
            see on a product is the price you pay.
          </Para>
        ) : policy ? (
          <Para>
            Delivery is free on orders of {formatPrice(policy.freeAbove)} or more, counted after any
            coupon. Below that it is a flat {formatPrice(policy.flatFee)}, the same wherever you are.
          </Para>
        ) : (
          <Para>
            Your delivery charge is shown on the bag and again at checkout, before you pay. It is a
            flat charge that does not change with distance.
          </Para>
        )}
        <Para>
          We deliberately do not charge by distance. Two people buying the same dress pay the same for
          it, whether they live in the next street or a thousand kilometres away.
        </Para>
      </Section>

      <Section title="How long it takes">
        <Para>
          Orders are packed and handed to the courier within {detail(SHOP.dispatchWindow)} of payment.
          After that, most of India sees a parcel in two to six working days, with the far north-east
          and the islands at the longer end.
        </Para>
        <Para>
          Those are the courier&apos;s working estimates rather than promises we can enforce. Weather,
          strikes and festival backlogs all happen, and we would rather tell you that than quote a
          date we cannot keep.
        </Para>
      </Section>

      <Section title="Places we cannot reach">
        <Para>
          A few pincodes are not served by our couriers at all. You can check yours on any product page
          before you order, and if it is not serviceable we will say so rather than take the money and
          find out later.
        </Para>
      </Section>

      <Section title="Tracking your parcel">
        <Bullets
          items={[
            "We email a tracking link as soon as the parcel leaves us.",
            <>
              You can also see it against the order in your{" "}
              <Link href="/profile" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
                account
              </Link>
              .
            </>,
            <>
              If tracking has not moved in three working days, write to {detail(SHOP.email)} and we
              will chase the courier ourselves.
            </>,
          ]}
        />
      </Section>

      <Section title="If it arrives damaged">
        <Para>
          Tell us within seven days and send a photo, and we will refund or replace it. The{" "}
          <Link href="/refunds" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            returns policy
          </Link>{" "}
          sets out how that works. You never pay for the return leg on a parcel that arrived broken.
        </Para>
      </Section>
    </PolicyPage>
  );
}
