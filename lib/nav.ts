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
  /** Local hero/card art. Bundled so it renders before the API is warm. */
  image: string;
  /**
   * Tailwind object-position for `image`. The art is composed off-centre, so a
   * default centre crop drops the subject once a card is squarer than the file.
   */
  imageFocus: string;
  highlights: NavHighlight[];
}

export const collections: NavCollection[] = [
  {
    label: "Kitchen",
    slug: "kitchen",
    tagline: "Cook cute",
    blurb: "Pastel cookware, storage and little helpers that make the kitchen feel like a hug.",
    image: "/categories/kitchen.webp",
    imageFocus: "object-top",
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
    image: "/categories/clothing.webp",
    imageFocus: "object-right",
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
    image: "/categories/artificial-nails.webp",
    imageFocus: "object-right",
    highlights: [
      { label: "Press-on sets", href: "/products?search=press" },
      { label: "French tips", href: "/products?search=french" },
      { label: "Glitter", href: "/products?search=glitter" },
      { label: "Nail care", href: "/products?search=care" },
    ],
  },
];

const bySlug = new Map(collections.map((collection) => [collection.slug, collection]));

/**
 * The bundled art for a category the API knows about but has no photo for.
 * A seeded catalogue ships every category with `image: null`, which otherwise
 * leaves the storefront's main collection grid as three bare gradients.
 */
export function collectionArt(slug: string): { image: string; imageFocus: string } | null {
  const collection = bySlug.get(slug);
  return collection ? { image: collection.image, imageFocus: collection.imageFocus } : null;
}

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
      { label: "Contact us", href: "/contact" },
      { label: "Track your order", href: "/profile#orders" },
      { label: "Grievances", href: "/contact#if-something-goes-wrong" },
    ],
  },
  {
    // On every page rather than tucked away one level down: the Consumer
    // Protection (E-Commerce) Rules expect it, and the payment provider checks.
    title: "Legal",
    links: [
      { label: "Terms & conditions", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Returns & refunds", href: "/refunds" },
      { label: "Delivery", href: "/shipping" },
    ],
  },
];

export const announcements = [
  "Tracked delivery across India",
  "New pastel drops every Friday",
  "Secure payments via Razorpay",
  "Handpicked, small-batch finds",
];
