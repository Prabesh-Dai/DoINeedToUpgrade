"use client";

import { ComparisonItem, UpgradeImpact, UpgradeOption, VerdictResult } from "@/types";
import { fpsHiddenReason, shortName } from "@/lib/fpsEstimate";
import InfoTip from "@/components/InfoTip";

interface Props {
  impact: UpgradeImpact | null;
  verdict: VerdictResult | null;
  comparison: ComparisonItem[] | null;
}

// Gains below this read as "no real difference"
const SMALL_GAIN = 3;
// Past this (the top of the FPS meter), more frames aren't worth upgrading for
const PLENTY_FPS = 120;

const labels: Record<UpgradeOption["component"], string> = {
  gpu: "Graphics",
  cpu: "Processor",
  ram: "Memory",
  both: "CPU + GPU",
};

// Which comparison row holds the user's part for each option
const comparisonLabels: Partial<Record<UpgradeOption["component"], string>> = {
  gpu: "Graphics",
  cpu: "Processor",
  ram: "Memory (RAM)",
};

const headlines: Record<UpgradeImpact["bottleneck"], string> = {
  gpu: "Your CPU could keep up with a much faster GPU, so that's the upgrade to get.",
  cpu: "Your GPU could push more frames if your CPU kept up.",
  balanced: "Your CPU and GPU are a good match. For a big jump, upgrade both.",
  ram: "The game wants more memory than you have, which causes stutters.",
};

// When the part that sets the limit is already about as fast as it gets
const maxedHeadlines: Partial<Record<UpgradeImpact["bottleneck"], string>> = {
  gpu: "Your GPU is already one of the fastest. This game just leans hard on it.",
  cpu: "Your CPU is already one of the fastest. This game just leans hard on it.",
};

// Laptop and Mac parts usually can't be swapped out
function isFixedHardware(gpu: string, cpu: string): boolean {
  return /laptop|mobile|max-q|apple/i.test(gpu) || /apple|\d{4,5}(u|h|hs|hx)\b/i.test(cpu);
}

function Detail({ option }: { option: UpgradeOption }) {
  if (option.component === "both") {
    return <><b className="font-semibold">{option.target}</b> together get you about {option.fps} fps</>;
  }
  if (!option.target) {
    return option.component === "ram"
      ? <>That&apos;s enough for this game. More won&apos;t help.</>
      : <>Already one of the fastest you can get</>;
  }
  if (option.gain < SMALL_GAIN) {
    return <>Upgrading to the {option.target} barely helps here</>;
  }
  return <><b className="font-semibold">{option.target}</b> gets you about {option.fps} fps</>;
}

export default function FpsBreakdown({ impact, verdict, comparison }: Props) {
  if (!impact || fpsHiddenReason(verdict, comparison)) return null;

  const userValue = (component: UpgradeOption["component"]) => {
    const item = comparison?.find((i) => i.label === comparisonLabels[component]);
    // CPU values can carry a clock speed suffix ("... @ 3.4 GHz")
    return item ? shortName(item.userValue.split(" @ ")[0]) : null;
  };
  const plenty = impact.currentFps >= PLENTY_FPS;
  const limitMaxed = impact.options.some((o) => o.component === impact.bottleneck && !o.target);
  const headline = plenty
    ? `You're already past ${PLENTY_FPS} fps, so an upgrade won't be noticeable.`
    : (limitMaxed && maxedHeadlines[impact.bottleneck]) || headlines[impact.bottleneck];
  const fixed = isFixedHardware(userValue("gpu") ?? "", userValue("cpu") ?? "");

  const header = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">What affects your FPS</p>
        <span className="-my-1.5 -mr-1">
          <InfoTip label="About these numbers">
            Rough numbers from benchmark scores and the game&apos;s listed specs. Resolution and settings change this too. At 4K the GPU matters more, at low settings the CPU does.
          </InfoTip>
        </span>
      </div>
      <h2 className="mt-1 text-lg sm:text-xl font-bold leading-snug tracking-tight">{headline}</h2>
    </>
  );

  if (plenty) {
    return (
      <section className="card overflow-hidden">
        <div className="p-5 sm:p-7">{header}</div>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="p-5 sm:p-7">
        {header}

        <ul className="mt-5 divide-y divide-base-content/[0.08] rounded border border-base-content/10">
          {impact.options.map((option) => {
            const have = option.component === "both" ? null : userValue(option.component);
            const small = option.gain < SMALL_GAIN;
            // Full bar = double the current FPS
            const pct = Math.min(option.gain / Math.max(impact.currentFps, 1), 1) * 100;
            return (
              <li
                key={option.component}
                className="relative grid grid-cols-[minmax(0,1fr)_6.5rem] gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[8rem_minmax(0,1fr)_8rem] sm:items-center"
              >
                {/* Sits on the row's top edge so it doesn't push the label over */}
                {option.component === impact.bottleneck && (
                  <span className="chip absolute left-3 top-0 -translate-y-1/2 bg-base-content text-base-100">Limit</span>
                )}
                <span className="text-sm font-semibold">{labels[option.component]}</span>
                <span className="col-start-1 row-start-2 flex min-w-0 flex-col gap-0.5 sm:col-start-2 sm:row-start-1">
                  {have && <span className="text-[13px] text-base-content/50 break-words">You have {have}</span>}
                  <span className="text-sm break-words"><Detail option={option} /></span>
                </span>
                <span className="col-start-2 row-span-2 row-start-1 self-center text-right tabular-nums sm:col-start-3 sm:row-span-1">
                  {option.gain === 0 ? (
                    <span className="text-sm font-medium text-base-content/40">No change</span>
                  ) : (
                    <>
                      <span className={small ? "text-lg font-semibold text-base-content/40" : "text-lg font-bold"}>+{option.gain}</span>
                      <span className="ml-0.5 text-xs font-semibold text-base-content/50">fps</span>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-sm bg-base-content/10">
                        <span className="block h-full animate-growX bg-base-content" style={{ width: `${pct}%` }} />
                      </span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-xs text-base-content/50">
          {fixed
            ? "Most laptops can't swap parts, so treat this as a guide for your next one. Storage only affects load times, so it isn't listed."
            : "Storage only affects load times, so it isn't listed."}
        </p>
      </div>
    </section>
  );
}
