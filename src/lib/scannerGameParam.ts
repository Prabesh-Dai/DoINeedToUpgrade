import { GameSource } from "@/types";

// The scanner scripts carry the selected game through the round trip
// (site → terminal → site), so after importing specs we can go straight to
// results instead of asking the user to pick the game again.

export interface ScannerGame {
  appid: number;
  source: GameSource;
}

/** Query string for a game, without a leading "?" or "&" (e.g. "game=730"). */
export function gameQuery({ appid, source }: ScannerGame): string {
  return source === "igdb" ? `game=${appid}&source=igdb` : `game=${appid}`;
}

/** Reads and validates a game from URL params. Returns null if missing or malformed. */
export function parseGameParams(params: URLSearchParams): ScannerGame | null {
  const game = params.get("game");
  if (!game || !/^\d{1,10}$/.test(game)) return null;
  return { appid: Number(game), source: params.get("source") === "igdb" ? "igdb" : "steam" };
}

/**
 * Suffix to append to the script's return URL ("&game=730" or "").
 * Only validated digits and known sources get through, so it's safe to embed in a shell script.
 */
export function gameReturnSuffix(params: URLSearchParams): string {
  const game = parseGameParams(params);
  return game ? `&${gameQuery(game)}` : "";
}
