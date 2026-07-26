import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Quicksand } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "../components/layout/AnnouncementBar";
import { CartDrawer } from "../components/layout/CartDrawer";
import { Footer } from "../components/layout/Footer";
import { MobileMenu } from "../components/layout/MobileMenu";
import { Navbar } from "../components/layout/Navbar";
import { SearchDialog } from "../components/layout/SearchDialog";
import { PageTransition } from "../components/motion/PageTransition";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../lib/auth";
import { CartProvider } from "../lib/cart";
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
  title: {
    default: "Shukarsh — Kitchen, clothing & press-on nails",
    template: "%s · Shukarsh",
  },
  description:
    "Small-batch kitchen finds, soft everyday clothing and salon-grade press-on nails. Pastel picks, secure Razorpay checkout, tracked delivery across India.",
  openGraph: {
    title: "Shukarsh — Kitchen, clothing & press-on nails",
    description:
      "Small-batch kitchen finds, soft everyday clothing and salon-grade press-on nails.",
    type: "website",
  },
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
                </ToastProvider>
              </CartProvider>
            </WishlistProvider>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
