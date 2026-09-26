import { parseRequirements } from "@/lib/parseRequirements";
import { Platform, ParsedGameRequirements, PlatformRequirements, GameRequirements, GameDetails } from "@/types";

function hasContent(reqs: GameRequirements | null): boolean {
  if (!reqs) return false;
  return Object.values(reqs).some((v) => v && v.trim() !== "");
}

export async function fetchGameDetails(appid: string): Promise<GameDetails | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appid)}`,
      { next: { revalidate: 86400 } } as RequestInit
    );

    if (!res.ok) return null;

    const data = await res.json();
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
  } catch {
    return null;
  }
}
