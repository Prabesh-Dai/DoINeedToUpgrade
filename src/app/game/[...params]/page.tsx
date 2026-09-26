import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchGameDetails } from "@/lib/fetchGameDetails";
import { slugify } from "@/lib/slugify";
import RequirementsCard from "@/components/RequirementsCard";
import GamePageClient from "@/components/GamePageClient";
import { Platform } from "@/types";

interface Props {
  params: Promise<{ params: string[] }>;
}

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

async function getGame(segments: string[]) {
  const appid = segments[0];
  if (!appid || !/^\d+$/.test(appid)) return null;
  return fetchGameDetails(appid);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const game = await getGame(segments);
  if (!game) return { title: "Game Not Found" };

  const reqs = game.requirements.recommended ?? game.requirements.minimum;
  const parts: string[] = [];
  if (reqs?.gpu) parts.push(reqs.gpu);
  if (reqs?.cpu) parts.push(reqs.cpu);
  if (reqs?.ram) parts.push(reqs.ram + " RAM");

  const description = parts.length > 0
    ? `Check if your PC can run ${game.name}. Requires ${parts.join(", ")}. Compare your specs against minimum and recommended requirements.`
    : `Check if your PC can run ${game.name}. Compare your hardware against the official system requirements.`;

  const slug = slugify(game.name);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://doineedtoupgrade.com";
  const canonical = `${baseUrl}/game/${game.appid}/${slug}`;

  return {
    title: `Can I Run ${game.name}? | System Requirements`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `Can I Run ${game.name}?`,
      description,
      url: canonical,
      images: [{ url: `${baseUrl}/api/og?appid=${game.appid}`, width: 1200, height: 630 }],
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

  const correctSlug = slugify(game.name);
  const providedSlug = segments[1];

  // Redirect to canonical URL if slug is missing or wrong
  if (!providedSlug || providedSlug !== correctSlug) {
    redirect(`/game/${game.appid}/${correctSlug}`);
  }

  const minReqs = game.requirements.minimum;
  const recReqs = game.requirements.recommended;
  const reqs = recReqs ?? minReqs;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://doineedtoupgrade.com";
  const canonical = `${baseUrl}/game/${game.appid}/${correctSlug}`;

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

      {/* SEO prose, styled as a quiet footer */}
      <section className="max-w-2xl border-t border-base-content/10 pt-6 text-sm leading-relaxed text-base-content/60">
        <h2 className="mb-1.5 font-semibold text-base-content/80">About {game.name} system requirements</h2>
        <p>
          {game.name} is available on {game.availablePlatforms.map((p) => platformLabels[p]).join(", ")}.
          {recReqs?.gpu && ` The recommended graphics card is ${recReqs.gpu}.`}
          {recReqs?.cpu && ` You'll want at least a ${recReqs.cpu} processor.`}
          {recReqs?.ram && ` The game recommends ${recReqs.ram} of RAM.`}
          {minReqs?.gpu && recReqs?.gpu && minReqs.gpu !== recReqs.gpu && ` At minimum, a ${minReqs.gpu} is required.`}
        </p>
        <p className="mt-1.5">
          Use the compatibility checker above to see how your hardware compares.
        </p>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.name,
            url: canonical,
            image: game.headerImage,
            applicationCategory: "GameApplication",
            gamePlatform: "PC",
            operatingSystem: game.availablePlatforms.map((p) => platformLabels[p]).join(", "),
            ...(reqs?.cpu && { processorRequirements: reqs.cpu }),
            ...(reqs?.ram && { memoryRequirements: reqs.ram }),
            ...(reqs?.storage && { storageRequirements: reqs.storage }),
            ...(reqs?.os && { softwareRequirements: reqs.os }),
          }),
        }}
      />
    </div>
  );
}
