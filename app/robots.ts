import type { MetadataRoute } from "next";
import { absolute } from "../lib/seo";

/**
 * Everything a shopper can browse is fair game. Everything behind a sign-in, or
 * that only means anything to one person, is not.
 *
 * These pages are not secret, they are just worthless in a search result: a
 * crawler indexing an empty cart or a sign-in form spends the shop's crawl budget
 * on pages nobody can search their way into. The admin area is listed for the
 * same reason and is not relying on this for anything: it is behind a token, and
 * a robots file is a request rather than a lock.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/cart",
          "/checkout",
          "/orders",
          "/profile",
          "/wishlist",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: absolute("/sitemap.xml"),
  };
}
