import { GameSource } from "@/types";

// Fallback for the downloaded scanner apps, which can't carry the game in their
// return URL. The game is remembered when it's picked and restored after import.
const STORAGE_KEY = "pendingGameCheck";
// A scan round trip takes minutes; keep this short so an old pick can't hijack a later scan
const EXPIRATION_MS = 60 * 60 * 1000;

interface PendingGame {
  appid: number;
  source: GameSource;
  gameName: string;
  savedAt: string;
}

export function savePendingGame(appid: number, source: GameSource, gameName: string): void {
  const data: PendingGame = {
    appid,
    source,
    gameName,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode, quota); the URL param path still works
  }
}

export function getPendingGame(): PendingGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as Partial<PendingGame>;
    const age = Date.now() - new Date(data.savedAt ?? 0).getTime();
    if (typeof data.appid !== "number" || !(age <= EXPIRATION_MS)) {
      clearPendingGame();
      return null;
    }

    // Entries saved before `source` existed were always Steam games
    return { ...data, source: data.source === "igdb" ? "igdb" : "steam" } as PendingGame;
  } catch {
    return null;
  }
}

export function clearPendingGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
