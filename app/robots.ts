import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

/** /robots.txt — halaman pribadi & teknis tidak untuk mesin pencari. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/payment", "/login", "/register", "/api/"],
    },
    sitemap: `${siteConfig.url.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
