import { HeartHandshake, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { RevealGroup, RevealItem } from "../motion/Reveal";

const props = [
  {
    icon: Truck,
    title: "Free delivery",
    copy: "On us on every order, with a tracking link.",
    tone: "bg-lavender-100 text-lavender-700",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    copy: "UPI, cards and wallets via Razorpay.",
    tone: "bg-blush-100 text-blush-500",
  },
  {
    icon: PackageCheck,
    title: "Small batch",
    copy: "Handpicked pieces, never mass produced.",
    tone: "bg-peach-100 text-peach-400",
  },
  {
    icon: HeartHandshake,
    title: "Real support",
    copy: "A human replies within one working day.",
    tone: "bg-mint-100 text-mint-400",
  },
];

export function ValueProps() {
  return (
    <section className="section-shell py-8 sm:py-10">
      <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.07}>
        {props.map(({ icon: Icon, title, copy, tone }) => (
          <RevealItem key={title}>
            <div className="group flex h-full items-start gap-4 rounded-4xl bg-surface/80 p-5 shadow-soft transition-transform duration-500 ease-[var(--ease-soft)] hover:-translate-y-1 hairline">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}>
                <Icon className="h-5 w-5" strokeWidth={2.3} />
              </span>
              <span>
                <span className="block font-display text-base text-ink">{title}</span>
                <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-muted">{copy}</span>
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
