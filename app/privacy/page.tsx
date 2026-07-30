import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Para, PolicyPage, Section } from "../../components/legal/PolicyPage";
import { openGraphFor } from "../../lib/seo";
import { SHOP, detail } from "../../lib/shop";

const TITLE = "Privacy";
const INTRO =
  "What we collect, why we need it, and who else sees it. We do not sell your details and we do not run advertising trackers.";

export const metadata: Metadata = {
  title: TITLE,
  description:
    "What Shukarsh collects, why, who processes it, and how to have it corrected or deleted.",
  alternates: { canonical: "/privacy" },
  openGraph: openGraphFor({ path: "/privacy", title: TITLE, description: INTRO }),
};

export default function PrivacyPage() {
  return (
    <PolicyPage title={TITLE} intro={INTRO}>
      <Section title="What we collect">
        <Bullets
          items={[
            "Your name, email address and phone number, when you make an account or place an order.",
            "The delivery address for each order, because a parcel needs somewhere to go.",
            "What you have ordered, and what you have saved to your wishlist.",
            "Your password, stored only as a one-way hash. Nobody here can read it, including us.",
          ]}
        />
        <Para>
          We never see your card number. Payment details are typed into Razorpay&apos;s own checkout and
          go straight to them, so they never touch our servers. What comes back to us is a payment
          reference and whether it worked.
        </Para>
      </Section>

      <Section title="Why we need it">
        <Bullets
          items={[
            "To take payment, pack your order and get it delivered.",
            "To email you a receipt, a dispatch note and tracking.",
            "To handle returns and refunds, and to answer you when you write in.",
            "To keep the tax records an Indian business is required to keep.",
          ]}
        />
        <Para>
          If you left a bag behind at checkout we may send one email reminding you it is there. It has
          an unsubscribe path, and we do not send a second.
        </Para>
      </Section>

      <Section title="Who else handles it">
        <Para>
          Running a shop means using other companies for parts of it. Each one sees only what its job
          needs:
        </Para>
        <Bullets
          items={[
            "Razorpay takes the payment and issues refunds. They handle your card details; we do not.",
            "Shiprocket and the courier it books get your name, address and phone number, because that is what a delivery is.",
            "Resend sends our emails, so it handles your email address and what the email says.",
            "Supabase stores our database, and Vercel and Render run the site and its backend.",
          ]}
        />
        <Para>
          Nobody on that list is allowed to use your details for their own marketing, and we do not
          sell or rent your information to anyone at all.
        </Para>
      </Section>

      <Section title="What we do not do">
        <Para>
          There are no advertising pixels, no analytics trackers and no third-party cookies on this
          site. We are not following you around the internet, and there is nothing here to opt out of
          because we never turned it on.
        </Para>
        <Para>
          Your bag is kept in your own browser rather than on our servers, which is why it survives a
          refresh but does not follow you to another device. Signing in stores a token in your browser
          so you stay signed in; clearing your browser data removes it.
        </Para>
      </Section>

      <Section title="How long we keep it">
        <Para>
          Order and tax records are kept for as long as Indian tax law requires them, which is why
          deleting an account does not erase past invoices. Everything else goes when you ask for it to
          go.
        </Para>
      </Section>

      <Section title="Your rights">
        <Para>
          Write to {detail(SHOP.email)} and you can ask us to show you what we hold, correct it, or
          delete it. We will confirm within 48 hours and finish within a month. If you are unhappy with
          how we handled it, our grievance officer is named on the{" "}
          <Link href="/contact" className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2">
            contact page
          </Link>
          .
        </Para>
      </Section>

      <Section title="Children">
        <Para>
          This shop is meant for adults. We do not knowingly collect anything from children, and if you
          believe we have, tell us and it will be removed.
        </Para>
      </Section>

      <Section title="Changes">
        <Para>
          If this policy changes in a way that matters, the new version goes up here. Carrying on using
          the shop after that means the new version applies.
        </Para>
      </Section>
    </PolicyPage>
  );
}
