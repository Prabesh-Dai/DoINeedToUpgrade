export interface PopularGame {
  appid: number;
  /** Steam's name (minus ™/®); its slug must match the game page's canonical URL */
  name: string;
  /** Cover image, only for games where Steam's standard /apps/{appid}/header.jpg is missing or a grey placeholder */
  header?: string;
}

// Refreshed Sep 2026 from Steam's most-played chart plus the biggest recent releases.
// Order matters: the first 6 are the home page cards, the first 18 are the "Popular games to check" links.
export const popularGames: PopularGame[] = [
  { appid: 1808500, name: "ARC Raiders" },
  { appid: 2807960, name: "Battlefield 6", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2807960/c12d12ce3c7d217398d3fcad77427bfc9d57c570/header.jpg" },
  { appid: 2246340, name: "Monster Hunter Wilds" },
  { appid: 1903340, name: "Clair Obscur: Expedition 33" },
  { appid: 2358720, name: "Black Myth: Wukong" },
  { appid: 1091500, name: "Cyberpunk 2077" },
  { appid: 3240220, name: "Grand Theft Auto V Enhanced" },
  { appid: 730, name: "Counter-Strike 2" },
  { appid: 2767030, name: "Marvel Rivals" },
  { appid: 553850, name: "HELLDIVERS 2" },
  { appid: 2622380, name: "ELDEN RING NIGHTREIGN" },
  { appid: 2483190, name: "Forza Horizon 6", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2483190/a3f1465050b6103274991a29b7462d3f28918b5d/header_alt_assets_4.jpg" },
  { appid: 3764200, name: "Resident Evil Requiem", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3764200/ce5437442768e38eb575f205ab9397d0264017b0/header.jpg" },
  { appid: 3321460, name: "Crimson Desert Enhanced" },
  { appid: 1086940, name: "Baldur's Gate 3" },
  { appid: 3606480, name: "Call of Duty: Black Ops 7", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3606480/d7041a15f572f7702d5f4bc97e498cd3e1cc62e2/header.jpg" },
  { appid: 2694490, name: "Path of Exile 2" },
  { appid: 1771300, name: "Kingdom Come: Deliverance II" },
  { appid: 3280350, name: "DEATH STRANDING 2: ON THE BEACH", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3280350/6270c77b0729e2df0a17d660286eeddfd9169386/header.jpg" },
  { appid: 3768760, name: "007 First Light", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3768760/9f0d16a4d9a826d62cddf7f5ea25d10b4b2f45b9/header_alt_assets_3.jpg" },
  { appid: 4080220, name: "EA SPORTS FC 27", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4080220/ff6a3779f1ca83aae8ad3878454f6c11008ea24d/header.jpg" },
  { appid: 1172470, name: "Apex Legends" },
  { appid: 570, name: "Dota 2" },
  { appid: 578080, name: "PUBG: BATTLEGROUNDS" },
  { appid: 2507950, name: "Delta Force" },
  { appid: 2357570, name: "Overwatch" },
  { appid: 252490, name: "Rust" },
  { appid: 1623730, name: "Palworld" },
  { appid: 1245620, name: "ELDEN RING" },
  { appid: 1174180, name: "Red Dead Redemption 2" },
  { appid: 3017860, name: "DOOM: The Dark Ages" },
  { appid: 2677660, name: "Indiana Jones and the Great Circle" },
  { appid: 1285190, name: "Borderlands 4" },
  { appid: 3159330, name: "Assassin's Creed Shadows" },
  { appid: 2001120, name: "Split Fiction" },
  { appid: 1030300, name: "Hollow Knight: Silksong" },
  { appid: 3489700, name: "Stellar Blade" },
  { appid: 2651280, name: "Marvel's Spider-Man 2" },
  { appid: 2623190, name: "The Elder Scrolls IV: Oblivion Remastered", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2623190/a7cee9165bb1bfc092c390c5cff215ce0e381dfc/header.jpg" },
  { appid: 2183900, name: "Warhammer 40,000: Space Marine 2" },
  { appid: 3008130, name: "Dying Light: The Beast" },
  { appid: 1643320, name: "S.T.A.L.K.E.R. 2: Heart of Chornobyl" },
  { appid: 1145350, name: "Hades II" },
  { appid: 1295660, name: "Sid Meier's Civilization VII" },
  { appid: 2868840, name: "Slay the Spire 2" },
  { appid: 2344520, name: "Diablo IV" },
  { appid: 892970, name: "Valheim" },
  { appid: 359550, name: "Tom Clancy's Rainbow Six Siege" },
  { appid: 236390, name: "War Thunder" },
  { appid: 1364780, name: "Street Fighter 6" },
  { appid: 2073850, name: "THE FINALS" },
  { appid: 1144200, name: "Ready or Not" },
  { appid: 3527290, name: "PEAK", header: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3527290/31bac6b2eccf09b368f5e95ce510bae2baf3cfcd/header.jpg" },
  { appid: 3241660, name: "R.E.P.O." },
  { appid: 2215430, name: "Ghost of Tsushima DIRECTOR'S CUT" },
  { appid: 2909400, name: "FINAL FANTASY VII REBIRTH" },
  { appid: 2531310, name: "The Last of Us Part II Remastered" },
  { appid: 1941540, name: "Mafia: The Old Country" },
  { appid: 413150, name: "Stardew Valley" },
  { appid: 292030, name: "The Witcher 3: Wild Hunt - Complete Edition" },
];

export function headerImage(game: PopularGame): string {
  return game.header ?? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;
}

// Deduplicate by appid
const seen = new Set<number>();
export const uniquePopularGames = popularGames.filter((g) => {
  if (seen.has(g.appid)) return false;
  seen.add(g.appid);
  return true;
});
