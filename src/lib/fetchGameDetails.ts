import { parseRequirements } from "@/lib/parseRequirements";
import { Platform, ParsedGameRequirements, PlatformRequirements, GameRequirements, GameDetails } from "@/types";

function hasContent(reqs: GameRequirements | null): boolean {
  if (!reqs) return false;
  return Object.values(reqs).some((v) => v && v.trim() !== "");
}

export async function fetchGameDetails(appid: string): Promise<GameDetails | null> {
  try {
    return await fetchGameDetailsOrThrow(appid);
  } catch {
    return null;
  }
}

/**
 * Returns null only when Steam says the app doesn't exist; throws when Steam can't be reached
 * or rate-limits us. The cached game pages rely on this: a thrown error keeps the last good
 * page in the cache, while null would cache a 404 that search engines then drop.
 */
export async function fetchGameDetailsOrThrow(appid: string): Promise<GameDetails | null> {
  const res = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appid)}`,
    { next: { revalidate: 86400 } } as RequestInit
  );

  if (!res.ok) throw new Error(`Steam appdetails returned ${res.status}`);

  const data = await res.json();
  // Steam answers a throttled request with a literal null body
  if (!data || typeof data !== "object") throw new Error("Steam appdetails returned no data");
  // Steam sometimes keys the response by a different id (e.g. a package/DLC id)
  // than the one requested, so fall back to matching on data.steam_appid.
  const appData = data[appid]
    ?? Object.values(data as Record<string, { success?: boolean; data?: { steam_appid?: number } }>)
      .find((entry) => String(entry?.data?.steam_appid) === appid);

  if (!appData?.success) return null;

  const info = appData.data;

  const platformMap: Record<Platform, Record<string, string>> = {
    windows: info.pc_requirements || {},
    macos: info.mac_requirements || {},
    linux: info.linux_requirements || {},
  };

  const platformRequirements: PlatformRequirements = {};
  const availablePlatforms: Platform[] = [];

  for (const [platform, reqs] of Object.entries(platformMap) as [Platform, Record<string, string>][]) {
    if (reqs.minimum || reqs.recommended) {
      const parsed: ParsedGameRequirements = parseRequirements(reqs.minimum, reqs.recommended);
      if (hasContent(parsed.minimum) || hasContent(parsed.recommended)) {
        platformRequirements[platform] = parsed;
        availablePlatforms.push(platform);
      }
    }
  }

  const requirements = platformRequirements.windows ?? platformRequirements[availablePlatforms[0]] ?? { minimum: null, recommended: null };

  return {
    appid: Number(appid),
    name: info.name,
    headerImage: info.header_image,
    requirements,
    platformRequirements,
    availablePlatforms,
    source: "steam",
  };
}
