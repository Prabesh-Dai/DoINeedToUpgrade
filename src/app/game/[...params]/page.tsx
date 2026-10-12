import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { fetchGameDetailsOrThrow } from "@/lib/fetchGameDetails";
import { gamePath } from "@/lib/slugify";
import { uniquePopularGames } from "@/lib/popularGames";
import { SITE_URL } from "@/lib/site";
import RequirementsCard from "@/components/RequirementsCard";
import GamePageClient from "@/components/GamePageClient";
import { JsonLd } from "@/components/StructuredData";
import { Platform } from "@/types";

interface Props {
  params: Promise<{ params: string[] }>;
}

// Render each game on its first visit, then serve it from the cache for a day (matching the
// Steam fetch). Returning no params keeps the build independent of Steam; without
// generateStaticParams at all, every request would render from scratch.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

async function getGame(segments: string[]) {
  const appid = segments[0];
  if (!appid || !/^\d+$/.test(appid)) return null;
  return fetchGameDetailsOrThrow(appid);
}

// Steam's memory field usually already says "RAM" ("16 GB RAM"), but not always ("16 GB")
function formatRam(ram: string): string {
  return /\b(ram|memory)\b/i.test(ram) ? ram : `${ram} RAM`;
}

// Steam lists alternatives ("GTX 1060 / RX 580", "i5-8400 or Ryzen 5 2600"); a search snippet only has room for the first
function firstOption(spec: string): string {
  return spec.split(/\s+or\s+|\s*\/\s*|,\s+/i)[0].trim() || spec;
}

// The next dozen popular games, wrapping around, so every popular game page links on to others
function moreGames(appid: number) {
  const list = uniquePopularGames;
  const start = list.findIndex((g) => g.appid === appid) + 1;
  return Array.from({ length: Math.min(12, list.length - 1) }, (_, i) => list[(start + i) % list.length]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const game = await getGame(segments);
  if (!game) return { title: "Game Not Found" };

  const usingRecommended = !!game.requirements.recommended;
  const reqs = game.requirements.recommended ?? game.requirements.minimum;
  const parts: string[] = [];
  if (reqs?.gpu) parts.push(firstOption(reqs.gpu));
  if (reqs?.cpu) parts.push(firstOption(reqs.cpu));
  if (reqs?.ram) parts.push(formatRam(reqs.ram));

  const description = parts.length > 0
    ? `Can your PC run ${game.name}? ${usingRecommended ? "Recommended" : "Minimum"} specs: ${parts.join(", ")}. Compare your hardware with the minimum and recommended requirements.`
    : `Can your PC run ${game.name}? Compare your hardware with the official minimum and recommended requirements.`;

  const canonical = `${SITE_URL}${gamePath(game.appid, game.name)}`;

  return {
    title: `Can I Run ${game.name}? System Requirements`,
    description,
    alternates: { canonical },
    // Without any listed requirements the page has nothing to offer a searcher
    ...(game.availablePlatforms.length === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `Can I Run ${game.name}?`,
      description,
      url: canonical,
      images: [{ url: `${SITE_URL}/api/og?appid=${game.appid}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Can I Run ${game.name}?`,
      description,
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { params: segments } = await params;
  const appid = segments[0];

  if (!appid || !/^\d+$/.test(appid)) notFound();

  const game = await getGame(segments);
  if (!game) notFound();

  const path = gamePath(game.appid, game.name);

  // Missing, outdated or extra slug segments all point permanently at the one canonical URL
  if (`/game/${segments.join("/")}` !== path) {
    permanentRedirect(path);
  }

  const minReqs = game.requirements.minimum;
  const recReqs = game.requirements.recommended;
  const reqs = recReqs ?? minReqs;
  const canonical = `${SITE_URL}${path}`;
  const platformList = game.availablePlatforms.map((p) => platformLabels[p]).join(", ");
  const related = moreGames(game.appid);

  // Check for multi-platform
  const otherPlatforms = game.availablePlatforms.filter((p) => {
    const mainPlatform = game.platformRequirements.windows ? "windows" : game.availablePlatforms[0];
    return p !== mainPlatform;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {game.headerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.headerImage}
              alt={game.name}
              className="aspect-[460/215] w-full md:w-80 object-cover bg-base-300"
              width={460}
              height={215}
            />
          )}
          <div className="flex min-w-0 flex-col justify-center gap-3 p-5 sm:p-6">
            <p className="eyebrow">System requirements</p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">Can I run {game.name}?</h1>
            <div className="flex flex-wrap gap-1.5">
              {game.availablePlatforms.map((p) => (
                <span key={p} className="chip bg-base-content/[0.08] text-base-content/70">{platformLabels[p]}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Client comparison widget */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Your compatibility</h2>
        <GamePageClient game={game} />
      </section>

      {/* Requirements Tables */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">What {game.name} needs</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RequirementsCard title="Minimum" requirements={minReqs} />
          <RequirementsCard title="Recommended" requirements={recReqs} />
        </div>
      </section>

      {/* Other platform requirements */}
      {otherPlatforms.length > 0 && (
        <details className="group card overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
            Other platforms
            <span className="text-sm font-normal text-base-content/50 group-open:hidden">
              {otherPlatforms.map((p) => platformLabels[p]).join(", ")}
            </span>
          </summary>
          <div className="flex flex-col gap-6 border-t border-base-content/[0.08] p-5">
            {otherPlatforms.map((p) => {
              const platformReqs = game.platformRequirements[p];
              if (!platformReqs) return null;
              return (
                <div key={p}>
                  <h3 className="eyebrow mb-3">{platformLabels[p]}</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <RequirementsCard title="Minimum" requirements={platformReqs.minimum} />
                    <RequirementsCard title="Recommended" requirements={platformReqs.recommended} />
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* SEO prose and links to other games, styled as a quiet footer */}
      <section className="max-w-2xl border-t border-base-content/10 pt-6 text-sm leading-relaxed text-base-content/60">
        <h2 className="mb-1.5 font-semibold text-base-content/80">About {game.name} system requirements</h2>
        <p>
          {platformList && `${game.name} is available on ${platformList}.`}
          {recReqs?.gpu && ` The recommended graphics card is ${recReqs.gpu}.`}
          {recReqs?.cpu && ` You'll want at least a ${recReqs.cpu} processor.`}
          {recReqs?.ram && ` The game recommends ${formatRam(recReqs.ram)}.`}
          {minReqs?.gpu && minReqs.gpu !== recReqs?.gpu && ` At minimum, a ${minReqs.gpu} is required.`}
        </p>
        <p className="mt-1.5">
          Use the compatibility checker above to see how your hardware compares.
        </p>

        <h2 className="mb-1.5 mt-6 font-semibold text-base-content/80">More games to check</h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {related.map((g) => (
            <li key={g.appid} className="min-w-0">
              <Link
                href={gamePath(g.appid, g.name)}
                className="block truncate underline-offset-4 hover:text-base-content hover:underline"
                title={`Can I run ${g.name}?`}
              >
                Can I run {g.name}?
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: game.name,
          url: canonical,
          image: game.headerImage,
          applicationCategory: "GameApplication",
          gamePlatform: "PC",
          operatingSystem: platformList,
          ...(reqs?.cpu && { processorRequirements: reqs.cpu }),
          ...(reqs?.ram && { memoryRequirements: reqs.ram }),
          ...(reqs?.storage && { storageRequirements: reqs.storage }),
          ...(reqs?.os && { softwareRequirements: reqs.os }),
        }}
      />
    </div>
  );
}
