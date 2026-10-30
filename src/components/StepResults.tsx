"use client";

import { useState } from "react";
import { GameDetails, GameRequirements, VerdictResult, ComparisonItem, Platform, FpsEstimate, UpgradeImpact } from "@/types";
import ComparisonResult from "@/components/ComparisonResult";
import RequirementsEditor from "@/components/RequirementsEditor";
import VerdictPanel from "@/components/VerdictPanel";
import FpsStat from "@/components/FpsStat";
import FpsBreakdown from "@/components/FpsBreakdown";
import FpsSettingsBar from "@/components/FpsSettingsBar";
import { FpsSettings } from "@/lib/useFpsSettings";
import { LuChevronDown, LuSearch, LuPencil, LuSlidersHorizontal, LuGamepad2 } from "react-icons/lu";

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

interface Props {
  game: GameDetails | null;
  verdict: VerdictResult | null;
  comparison: ComparisonItem[] | null;
  minReqs: GameRequirements;
  recReqs: GameRequirements;
  onRequirementsChange: (min: GameRequirements, rec: GameRequirements) => void;
  onRerun: () => void;
  onCheckAnother: () => void;
  onEditSpecs: () => void;
  platform: Platform;
  userPlatform: Platform;
  availablePlatforms: Platform[];
  onPlatformChange: (platform: Platform) => void;
  fpsEstimate?: FpsEstimate | null;
  upgradeImpact?: UpgradeImpact | null;
  fpsSettings: FpsSettings;
}

export default function StepResults({
  game,
  verdict,
  comparison,
  minReqs,
  recReqs,
  onRequirementsChange,
  onRerun,
  onCheckAnother,
  onEditSpecs,
  platform,
  userPlatform,
  availablePlatforms,
  onPlatformChange,
  fpsEstimate,
  upgradeImpact,
  fpsSettings,
}: Props) {
  const [showEditor, setShowEditor] = useState(false);
  // The settings only change the estimate, so leave them out when there isn't one
  const hasFpsEstimate = !!fpsEstimate && fpsEstimate.confidence !== "none";

  // A few words beside the OS tabs (the full sentence is the tooltip), so
  // switching OS never adds a row or crowds the title
  let platformNote: { short: string; full: string } | null = null;
  if (platform !== userPlatform && availablePlatforms.length > 0) {
    platformNote = availablePlatforms.includes(userPlatform)
      ? { short: "Not your OS", full: `You're on ${platformLabels[userPlatform]}. These are the ${platformLabels[platform]} specs.` }
      : {
          short: `No ${platformLabels[userPlatform]} specs`,
          full: `This game doesn't list ${platformLabels[userPlatform]} specs, so these are for ${platformLabels[platform]}.`,
        };
  }
  // With a single OS there's nothing to pick, but it still shows when it isn't the user's
  const showPlatforms = availablePlatforms.length > 1 || platformNote !== null;

  return (
    <div className="animate-fadeIn flex flex-col gap-5">
      <section className="card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {game?.headerImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={game.headerImage}
              alt=""
              className="aspect-[460/215] w-full md:w-56 lg:w-72 md:self-stretch object-cover bg-base-300"
            />
          ) : (
            <div className="grid aspect-[460/215] w-full md:w-56 lg:w-72 place-items-center bg-base-content/[0.04] text-base-content/25">
              <LuGamepad2 className="h-10 w-10" />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
            <div>
              <p className="eyebrow">Results for</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold leading-tight tracking-tight break-words">
                {game?.name ?? "Your custom requirements"}
              </h1>
            </div>

            {showPlatforms && (
              <div className="flex items-center gap-3">
                <div className="inline-flex w-fit shrink-0 rounded bg-base-content/[0.06] p-0.5" role="tablist" aria-label="Platform">
                  {availablePlatforms.map((p) => {
                    const active = p === platform;
                    return (
                      <button
                        key={p}
                        role="tab"
                        aria-selected={active}
                        className={`rounded-sm px-3 py-1 text-xs font-semibold transition-colors ${
                          active ? "bg-primary text-primary-content" : "text-base-content/60 hover:text-base-content"
                        }`}
                        onClick={() => onPlatformChange(p)}
                      >
                        {platformLabels[p]}
                      </button>
                    );
                  })}
                </div>
                {platformNote && (
                  <span className="min-w-0 truncate text-xs text-base-content/50" title={platformNote.full}>
                    {platformNote.short}
                  </span>
                )}
              </div>
            )}

            {hasFpsEstimate && <FpsSettingsBar settings={fpsSettings} className="mt-auto" />}
          </div>

          <div className="flex flex-col border-t border-base-content/[0.08] p-5 md:w-60 md:shrink-0 md:border-l md:border-t-0">
            <FpsStat
              key={`${game?.appid ?? "manual"}-${platform}`}
              fpsEstimate={fpsEstimate}
              verdict={verdict}
              comparison={comparison}
              settings={fpsSettings}
            />
          </div>
        </div>
      </section>

      {verdict && <VerdictPanel key={`${verdict.verdict}-${platform}`} result={verdict} />}

      <FpsBreakdown
        key={`breakdown-${game?.appid ?? "manual"}-${platform}`}
        impact={upgradeImpact ?? null}
        verdict={verdict}
        comparison={comparison}
        displayHz={fpsSettings.displayHz}
      />

      {comparison && <ComparisonResult items={comparison} />}

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="btn btn-ghost gap-2 self-start"
          onClick={() => setShowEditor(!showEditor)}
          aria-expanded={showEditor}
        >
          <LuSlidersHorizontal className="h-4 w-4" />
          Adjust requirements
          <LuChevronDown className={`h-4 w-4 transition-transform ${showEditor ? "rotate-180" : ""}`} />
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn btn-outline gap-2" onClick={onEditSpecs}>
            <LuPencil className="h-4 w-4" />
            Edit my specs
          </button>
          <button className="btn btn-primary gap-2" onClick={onCheckAnother}>
            <LuSearch className="h-4 w-4" />
            Check another game
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="animate-fadeIn">
          <RequirementsEditor
            minimum={minReqs}
            recommended={recReqs}
            onChange={onRequirementsChange}
            onSubmit={onRerun}
          />
        </div>
      )}
    </div>
  );
}
