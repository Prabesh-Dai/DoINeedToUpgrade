"use client";

import { useEffect, useState } from "react";
import { ComparisonItem, FpsEstimate, VerdictResult } from "@/types";
import { LuEye } from "react-icons/lu";
import InfoTip from "@/components/InfoTip";

interface Props {
  fpsEstimate: FpsEstimate | null | undefined;
  verdict: VerdictResult | null;
  comparison: ComparisonItem[] | null;
}

const METER_MAX = 120;

function tierColor(fps: number): string {
  if (fps < 30) return "bg-error";
  if (fps < 60) return "bg-warning";
  return "bg-success";
}

function useCountUp(target: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduced = document.documentElement.getAttribute("data-reduce-motion") === "true";
    if (reduced || target <= 0) {
      setCount(Math.max(target, 0));
      return;
    }
    setCount(0);
    const duration = 900;
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setCount(Math.round(eased * target));
      if (t < 1) rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return count;
}

function Header({ title = "Estimated FPS", note }: { title?: string; note?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="eyebrow">{title}</p>
      {/* Negative margin keeps the row as tall as the label, so it lines up with neighbouring eyebrows */}
      {note && <span className="-my-1.5 -mr-1"><InfoTip label="About this estimate">{note}</InfoTip></span>}
    </div>
  );
}

function Meter({ value }: { value: number }) {
  const pct = Math.min(value / METER_MAX, 1) * 100;
  return (
    <div className="mt-3">
      <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-base-content/10">
        <div className={`absolute inset-y-0 left-0 animate-growX ${tierColor(value)}`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-y-0 left-1/4 w-px bg-base-100" />
        <span className="absolute inset-y-0 left-1/2 w-px bg-base-100" />
      </div>
      <div className="relative mt-1 h-3 text-[10px] tabular-nums text-base-content/40">
        <span className="absolute left-1/4 -translate-x-1/2">30</span>
        <span className="absolute left-1/2 -translate-x-1/2">60</span>
        <span className="absolute right-0">120</span>
      </div>
    </div>
  );
}

export default function FpsStat({ fpsEstimate, verdict, comparison }: Props) {
  const [showHidden, setShowHidden] = useState(false);

  const hasEstimate = !!fpsEstimate && fpsEstimate.confidence !== "none";
  const hasFloor = !!fpsEstimate && fpsEstimate.confidence === "none"
    && !!verdict && (verdict.verdict === "pass" || verdict.verdict === "minimum");

  // Hide FPS when failing minimum or the OS doesn't match (cross-platform warn)
  const osMismatch = comparison?.some(
    (item) => item.label === "Operating System" && item.minStatus === "warn"
  ) ?? false;
  const shouldHide = hasEstimate && (verdict?.verdict === "fail" || osMismatch);
  const visible = hasEstimate && (!shouldHide || showHidden);

  const count = useCountUp(visible ? fpsEstimate!.mid : 0);

  if (hasEstimate) {
    const concealed = shouldHide && !showHidden;
    const note = concealed
      ? osMismatch
        ? "Hidden because these requirements are for a different OS. Click to see it anyway."
        : "Hidden because your PC is below the minimum specs. Click to see it anyway."
      : shouldHide
        ? "This might not match real performance, since your PC doesn't fully fit these requirements."
        : fpsEstimate!.confidence === "limited"
          ? "Rough estimate. We only had part of the data we need."
          : "Based on how your CPU and GPU scores compare to the game's requirements.";

    // Same markup whether hidden or shown, so revealing it never shifts the layout
    const body = (value: number) => (
      <>
        <p className="flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tabular-nums tracking-tight leading-none">{value}</span>
          <span className="text-sm font-semibold text-base-content/50">fps</span>
        </p>
        <p className="mt-1.5 text-sm text-base-content/60 tabular-nums">
          Usually {fpsEstimate!.low}–{fpsEstimate!.high} fps
        </p>
        <Meter value={fpsEstimate!.mid} />
      </>
    );

    return (
      <div className="flex h-full flex-col">
        <Header note={note} />
        {concealed ? (
          <button
            type="button"
            onClick={() => setShowHidden(true)}
            className="group relative mt-1 w-full text-left"
            aria-label="Show estimated FPS anyway"
          >
            <div aria-hidden="true" className="pointer-events-none select-none opacity-40 blur-md">
              {body(fpsEstimate!.mid)}
            </div>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center gap-2 rounded border border-base-content/20 bg-base-100 px-4 py-2 text-sm font-semibold shadow-soft transition-colors group-hover:border-base-content/60">
                <LuEye className="h-4 w-4" />
                Show anyway
              </span>
            </span>
          </button>
        ) : (
          <div className="mt-1">{body(count)}</div>
        )}
      </div>
    );
  }

  if (hasFloor) {
    const floor = verdict!.verdict === "pass" ? 60 : 30;
    return (
      <div className="flex h-full flex-col">
        <Header
          title="Expected FPS"
          note="Your hardware isn't in our database, so this is based on the verdict."
        />
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-5xl font-bold tabular-nums tracking-tight leading-none">{floor}+</span>
          <span className="text-sm font-semibold text-base-content/50">fps</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Header note="Not enough data to estimate FPS for this setup." />
      <p className="mt-1 text-5xl font-bold leading-none text-base-content/25">N/A</p>
    </div>
  );
}
