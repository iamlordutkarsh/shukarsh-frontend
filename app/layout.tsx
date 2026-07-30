import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Quicksand } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { JsonLd } from "../components/seo/JsonLd";
import { CartDrawer } from "../components/layout/CartDrawer";
import { Footer } from "../components/layout/Footer";
import { MobileMenu } from "../components/layout/MobileMenu";
import { Navbar } from "../components/layout/Navbar";
import { SearchDialog } from "../components/layout/SearchDialog";
import { PageTransition } from "../components/motion/PageTransition";
import { SupportButton } from "../components/support/SupportButton";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { SITE_NAME, SITE_URL, organizationJsonLd, websiteJsonLd } from "../lib/seo";
import { UIProvider } from "../lib/ui-store";
import { WishlistProvider } from "../lib/wishlist";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, every relative canonical and share image resolves against
  // nothing and Next quietly drops it. It is the one setting the rest of the
  // metadata in this app depends on.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shukarsh — Kitchen, clothing & press-on nails",
    template: "%s · Shukarsh",
  },
  description:
    "Small-batch kitchen finds, soft everyday clothing and salon-grade press-on nails. Pastel picks, secure Razorpay checkout, tracked delivery across India.",
  // No canonical here on purpose. Metadata is inherited, so one set on the root
  // layout would have every page that does not override it claim to be a copy of
  // the home page. Each page names its own.
  openGraph: {
    title: "Shukarsh — Kitchen, clothing & press-on nails",
    description:
      "Small-batch kitchen finds, soft everyday clothing and salon-grade press-on nails.",
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fbf8ff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${fraunces.variable} ${quicksand.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <AuthProvider>
          <UIProvider>
            <WishlistProvider>
              <CartProvider>
                <ToastProvider>
                  <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
                  >
                    Skip to content
                  </a>

                  <AnnouncementBar />
                  <Navbar />

                  <main id="main" className="flex-1">
                    <PageTransition>{children}</PageTransition>
                  </main>

                  <Footer />

                  <SearchDialog />
                  <CartDrawer />
                  <MobileMenu />
                  <SupportButton />
                </ToastProvider>
              </CartProvider>
            </WishlistProvider>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
