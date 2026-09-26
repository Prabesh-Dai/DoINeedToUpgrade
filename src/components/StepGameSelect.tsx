"use client";

import { useState } from "react";
import GameSearch from "@/components/GameSearch";
import { GameSource } from "@/types";
import { uniquePopularGames } from "@/lib/popularGames";
import { LuScanLine, LuCpu, LuGauge, LuMonitorSmartphone, LuPencil, LuCircleAlert } from "react-icons/lu";

interface Props {
  onSelect: (id: number, source: GameSource) => void;
  onManualMode: () => void;
  loading: boolean;
  error: string | null;
  showInfo?: boolean;
  initialSource?: GameSource;
}

const featuredIds = [1245620, 1091500, 1086940, 730, 2358720, 1174180];
const featured = featuredIds
  .map((id) => uniquePopularGames.find((g) => g.appid === id))
  .filter((g): g is { appid: number; name: string } => !!g);

const features = [
  {
    icon: LuScanLine,
    title: "Detects your hardware",
    body: "We grab what we can from your browser. Want exact numbers? Run the scanner. It's open source and doesn't upload anything.",
  },
  {
    icon: LuCpu,
    title: "Uses real benchmarks",
    body: "Every CPU and GPU gets a performance score, so even older or weirdly named parts compare fairly.",
  },
  {
    icon: LuGauge,
    title: "Estimates your FPS",
    body: "Get a rough idea of the frame rate you'll see, based on how your parts stack up.",
  },
  {
    icon: LuMonitorSmartphone,
    title: "Works on Windows, macOS & Linux",
    body: "We check the requirements for your platform. The others are one click away.",
  },
];

export default function StepGameSelect({ onSelect, onManualMode, loading, error, showInfo = true, initialSource }: Props) {
  // Which popular card was clicked, so the loading overlay shows on that card only
  const [pendingId, setPendingId] = useState<number | null>(null);

  function selectFromSearch(id: number, source: GameSource) {
    setPendingId(null);
    onSelect(id, source);
  }

  function selectFromCard(id: number) {
    setPendingId(id);
    onSelect(id, "steam");
  }

  return (
    <div className="animate-fadeIn flex flex-col items-center">
      <section className={`flex w-full flex-col items-center text-center ${showInfo ? "pt-6 sm:pt-16" : "pt-2 sm:pt-6"}`}>
        {showInfo ? (
          // Visible branding lives in the header; keep a heading for search engines and screen readers
          <h1 className="sr-only">Can your PC run it? Check any game&apos;s system requirements</h1>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pick a game</h1>
            <p className="mt-2 text-base-content/60">Your specs are saved. Now choose what you want to play.</p>
          </>
        )}

        <div className={`w-full max-w-2xl text-left ${showInfo ? "" : "mt-8"}`}>
          <GameSearch onSelect={selectFromSearch} initialSource={initialSource} busy={loading && pendingId === null} />
        </div>

        {error && (
          <div role="alert" className="notice border-l-error mt-6 w-full max-w-2xl items-center text-left">
            <LuCircleAlert className="h-5 w-5 shrink-0 text-error" />
            <span>{error}</span>
          </div>
        )}

        <button
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors"
          onClick={onManualMode}
        >
          <LuPencil className="h-3.5 w-3.5" />
          Or enter requirements manually
        </button>
      </section>

      <section className="mt-14 w-full max-w-3xl" aria-labelledby="popular-heading">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="popular-heading" className="eyebrow">Popular checks</h2>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {featured.map((g) => (
            <li key={g.appid}>
              <button
                onClick={() => selectFromCard(g.appid)}
                disabled={loading}
                aria-busy={loading && pendingId === g.appid}
                className={`group relative block w-full overflow-hidden rounded-md border border-base-content/[0.08] bg-base-100 text-left transition-[border-color,opacity] hover:border-base-content/25 ${
                  loading && pendingId !== g.appid ? "opacity-50" : ""
                }`}
              >
                {loading && pendingId === g.appid && (
                  <span className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-base-100/85 backdrop-blur-[2px]" role="status">
                    <span className="loading loading-spinner loading-md" />
                    <span className="text-xs font-medium text-base-content/70">Loading requirements…</span>
                  </span>
                )}
                <div className="aspect-[460/215] overflow-hidden bg-base-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{g.name}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {showInfo && (
        <section className="mt-14 w-full max-w-3xl" aria-labelledby="features-heading">
          <h2 id="features-heading" className="eyebrow mb-3">What you get</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-md border border-base-content/[0.08] bg-base-content/[0.08]">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="relative isolate overflow-hidden bg-base-100 p-5 sm:p-6">
                {/* Oversized icon sits behind the text so it can be big without taking up space */}
                {/* Solid color + element opacity so overlapping strokes don't stack into brighter spots */}
                <Icon
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-6 -right-4 -z-10 h-32 w-32 text-base-content opacity-[0.07]"
                  strokeWidth={2.75}
                />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 max-w-[34ch] text-sm text-base-content/60 leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
