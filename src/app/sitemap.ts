import type { MetadataRoute } from "next";
import { uniquePopularGames } from "@/lib/popularGames";
import { gamePath } from "@/lib/slugify";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...uniquePopularGames.map((g) => ({
      url: `${SITE_URL}${gamePath(g.appid, g.name)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
