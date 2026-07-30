import type { Metadata } from "next";
import { Facts, Para, PolicyPage, Section } from "../../components/legal/PolicyPage";
import { openGraphFor } from "../../lib/seo";
import { SHOP, addressLines, detail } from "../../lib/shop";
import { whatsappLink } from "../../lib/support";

const TITLE = "Contact us";
const INTRO = "A real person, a real address and a real phone number. Write, message or call.";

export const metadata: Metadata = {
  title: TITLE,
  description: "How to reach Shukarsh, and who to escalate to if we let you down.",
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor({ path: "/contact", title: TITLE, description: INTRO }),
};

export default function ContactPage() {
  const chat = whatsappLink("Hi Shukarsh! I have a question.");
  const lines = addressLines();

  return (
    <PolicyPage title={TITLE} intro={INTRO}>
      <Section title="The shop">
        <Facts
          rows={[
            { label: "Registered name", value: detail(SHOP.legalName) },
            { label: "Type of business", value: detail(SHOP.entityType) },
            {
              label: "Address",
              value:
                lines.length > 0 ? (
                  <span className="block whitespace-pre-line">{lines.join("\n")}</span>
                ) : (
                  "not published yet"
                ),
            },
            ...(SHOP.gstin.trim() ? [{ label: "GSTIN", value: SHOP.gstin }] : []),
          ]}
        />
      </Section>

      <Section title="Reaching us">
        <Facts
          rows={[
            { label: "Email", value: detail(SHOP.email) },
            { label: "Phone", value: detail(SHOP.phone) },
            { label: "Hours", value: detail(SHOP.supportHours) },
            ...(chat
              ? [
                  {
                    label: "WhatsApp",
                    value: (
                      <a
                        href={chat}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-ink underline decoration-lavender-300 underline-offset-2"
                      >
                        Message us
                      </a>
                    ),
                  },
                ]
              : []),
          ]}
        />
        <Para>
          Email is the surest way to reach us, and it leaves both of us with a record. If your question
          is about an order, quoting the order number gets you a faster answer.
        </Para>
      </Section>

      <Section title="If something goes wrong" id="if-something-goes-wrong">
        <Para>
          Most problems are settled by writing to {detail(SHOP.email)}. If that has not worked, or you
          are unhappy with the answer, take it to our grievance officer, who is required to deal with
          it properly.
        </Para>
        <Facts
          rows={[
            { label: "Grievance officer", value: detail(SHOP.grievanceName) },
            { label: "Designation", value: detail(SHOP.grievanceDesignation) },
            { label: "Email", value: detail(SHOP.grievanceEmail) },
            { label: "Phone", value: detail(SHOP.grievancePhone) },
          ]}
        />
        <Para>
          We acknowledge every complaint within 48 hours and resolve it within one month, as the
          Consumer Protection (E-Commerce) Rules require. If we miss either, you can escalate to the
          National Consumer Helpline on 1915 or at consumerhelpline.gov.in.
        </Para>
      </Section>
    </PolicyPage>
  );
}
