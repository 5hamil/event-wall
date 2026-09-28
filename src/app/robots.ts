import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/club"] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
