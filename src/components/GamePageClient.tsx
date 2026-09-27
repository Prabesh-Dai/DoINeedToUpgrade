"use client";

import { useState, useEffect } from "react";
import { GameDetails, UserSpecs, GameRequirements } from "@/types";
import { compareSpecs } from "@/lib/compareSpecs";
import { computeVerdict } from "@/lib/computeVerdict";
import { estimateFps, estimateUpgrades } from "@/lib/fpsEstimate";
import { useBenchmarks } from "@/lib/useBenchmarks";
import VerdictPanel from "@/components/VerdictPanel";
import ComparisonResult from "@/components/ComparisonResult";
import FpsStat from "@/components/FpsStat";
import FpsBreakdown from "@/components/FpsBreakdown";
import { LuArrowRight, LuPencil } from "react-icons/lu";
import Link from "next/link";

interface Props {
  game: GameDetails;
}

function hasAnyField(reqs: GameRequirements): boolean {
  return Object.values(reqs).some((v) => v.trim() !== "");
}

export default function GamePageClient({ game }: Props) {
  const { cpuScores, gpuScores, loading } = useBenchmarks();
  const [specs, setSpecs] = useState<UserSpecs | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedSpecs");
      if (raw) {
        const { specs: saved } = JSON.parse(raw);
        if (saved) setSpecs(saved);
      }
    } catch {
      // ignore
    }
    setHasChecked(true);
  }, []);

  if (!hasChecked || loading) {
    return (
      <div className="flex justify-center p-10">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  if (!specs) {
    return (
      <section className="card">
        <div className="card-body flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Can your PC handle it?</h3>
            <p className="mt-1 max-w-md text-sm text-base-content/60">
              Check your hardware against {game.name}&apos;s requirements. Takes about 30 seconds.
            </p>
          </div>
          <Link href={`/?game=${game.appid}`} className="btn btn-primary gap-2 shrink-0">
            Check my PC
            <LuArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const minReqs = game.requirements.minimum ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
  const recReqs = game.requirements.recommended ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
  const minArg = hasAnyField(minReqs) ? minReqs : null;
  const recArg = hasAnyField(recReqs) ? recReqs : null;

  const { items, scores } = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores);
  const verdict = computeVerdict(items);
  const fpsEstimate = estimateFps(scores);
  const upgradeImpact = estimateUpgrades(scores, specs.cpu, cpuScores, gpuScores);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
        <VerdictPanel result={verdict} />
        <section className="card p-5 md:self-start">
          <FpsStat fpsEstimate={fpsEstimate} verdict={verdict} comparison={items} />
        </section>
      </div>
      <FpsBreakdown impact={upgradeImpact} verdict={verdict} comparison={items} />
      <ComparisonResult items={items} />
      <div className="flex justify-center">
        <Link href={`/?game=${game.appid}`} className="btn btn-ghost btn-sm gap-2">
          <LuPencil className="h-3.5 w-3.5" />
          Check with different specs
        </Link>
      </div>
    </div>
  );
}
