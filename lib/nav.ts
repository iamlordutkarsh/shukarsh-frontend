/**
 * Static navigation model. Deliberately not fetched from the API so the app
 * shell renders instantly and never breaks when the backend is cold.
 */

export interface NavHighlight {
  label: string;
  href: string;
}

export interface NavCollection {
  label: string;
  slug: string;
  tagline: string;
  blurb: string;
  highlights: NavHighlight[];
}

export const collections: NavCollection[] = [
  {
    label: "Kitchen",
    slug: "kitchen",
    tagline: "Cook cute",
    blurb: "Pastel cookware, storage and little helpers that make the kitchen feel like a hug.",
    highlights: [
      { label: "Cookware", href: "/products?search=pan" },
      { label: "Storage", href: "/products?search=storage" },
      { label: "Utensils", href: "/products?search=utensil" },
      { label: "Bakeware", href: "/products?search=bake" },
    ],
  },
  {
    label: "Clothing",
    slug: "clothing",
    tagline: "Soft silhouettes",
    blurb: "Everyday pieces in creamy neutrals and sugared pastels, cut to actually be comfy.",
    highlights: [
      { label: "Tops", href: "/products?search=top" },
      { label: "Dresses", href: "/products?search=dress" },
      { label: "Knitwear", href: "/products?search=knit" },
      { label: "Loungewear", href: "/products?search=lounge" },
    ],
  },
  {
    label: "Nails",
    slug: "artificial-nails",
    tagline: "Press-on magic",
    blurb: "Salon-grade press-on sets, glitters and chromes ready in five minutes flat.",
    highlights: [
      { label: "Press-on sets", href: "/products?search=press" },
      { label: "French tips", href: "/products?search=french" },
      { label: "Glitter", href: "/products?search=glitter" },
      { label: "Nail care", href: "/products?search=care" },
    ],
  },
];

export const primaryNav: NavHighlight[] = [
  { label: "New in", href: "/products" },
  ...collections.map((collection) => ({
    label: collection.label,
    href: `/categories/${collection.slug}`,
  })),
];

export const footerGroups: { title: string; links: NavHighlight[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/products" },
      ...collections.map((collection) => ({
        label: collection.label,
        href: `/categories/${collection.slug}`,
      })),
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My account", href: "/profile" },
      { label: "Orders", href: "/profile" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Bag", href: "/cart" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact us", href: "mailto:hello@shukarsh.com" },
      { label: "Track your order", href: "/profile#orders" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export const announcements = [
  "Free shipping on every order",
  "New pastel drops every Friday",
  "Secure payments via Razorpay",
  "Handpicked, small-batch finds",
];
