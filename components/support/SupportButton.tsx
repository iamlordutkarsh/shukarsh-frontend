"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "../../lib/support";
import { WhatsAppIcon } from "./WhatsAppIcon";

const GREETING = "Hi Shukarsh! I could use a hand with ";

/**
 * The floating chat button.
 *
 * Bottom left, not the usual right: toasts already own that corner, and a
 * confirmation sliding in over the support button is exactly the moment somebody
 * reaches for it. Sits under the modal and drawer layers on purpose.
 */
export function SupportButton() {
  const pathname = usePathname();
  const href = whatsappLink(GREETING);

  // No number configured, or the shop looking at its own admin panel.
  if (!href || pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 left-4 z-[100] flex items-center rounded-full bg-[#25d366] p-3 text-white shadow-lift transition-transform hover:-translate-y-0.5 sm:bottom-7 sm:left-7"
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[7rem] group-hover:pl-2">
        Chat with us
      </span>
    </a>
  );
}
