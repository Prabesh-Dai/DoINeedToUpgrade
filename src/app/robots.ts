import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        // Internal API routes; /api/og stays crawlable so game share images can be fetched
        disallow: "/api/",
      },
      { userAgent: ["AhrefsBot", "SemrushBot"], disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
