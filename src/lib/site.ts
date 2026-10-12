// Canonical origin for canonical tags, sitemap, robots and structured data.
// Vercel serves www and redirects the bare domain to it, so canonicals must point at www
// (a canonical that redirects sends search engines mixed signals).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.doineedtoupgrade.com").replace(/\/+$/, "");

export const SITE_NAME = "Do I Need To Upgrade";

export const SITE_DESCRIPTION =
  "Check if your PC can run any Steam game. Compare your CPU, GPU, RAM and storage against game requirements instantly.";
