"use client";

import { useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import {
  DISPLAY_RANGE,
  DISPLAY_RATES,
  FpsSettings,
  PRESETS,
  RESOLUTION_RANGE,
  RESOLUTION_STEPS,
} from "@/lib/useFpsSettings";

const arrowClass =
  "grid h-6 w-6 place-items-center rounded-sm text-base-content/60 transition-colors hover:bg-base-content/[0.08] hover:text-base-content disabled:pointer-events-none disabled:opacity-30";

// Every stepper's value sits in the same fixed slot, so the three controls
// match in width and their values line up on the same centre
const slotClass = "flex h-6 w-16 items-center justify-center rounded-sm text-xs font-semibold tabular-nums";

/** ‹ value › control. An arrow is disabled when its handler is missing */
function Stepper({ label, onPrev, onNext, children }: {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit items-center rounded bg-base-content/[0.06] p-0.5">
      <button type="button" className={arrowClass} aria-label={`Lower ${label.toLowerCase()}`} disabled={!onPrev} onClick={onPrev}>
        <LuChevronLeft className="h-3.5 w-3.5" />
      </button>
      {children}
      <button type="button" className={arrowClass} aria-label={`Higher ${label.toLowerCase()}`} disabled={!onNext} onClick={onNext}>
        <LuChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Stepper with a typeable number. The arrows (and the Up/Down keys) move to the
 * next common value; typing sets any value in range, applied on Enter or blur.
 */
function NumberStepper({ label, unit, spaced = false, value, steps, range, onChange }: {
  label: string;
  unit: string;
  /** Space before the unit: "540 Hz", but "1600p" */
  spaced?: boolean;
  value: number;
  steps: number[];
  range: { min: number; max: number };
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(range.max, Math.max(range.min, n));
  const below = (n: number) => [...steps].reverse().find((s) => s < n);
  const above = (n: number) => steps.find((s) => s > n);
  const prev = below(value);
  const next = above(value);
  const text = draft ?? String(value);

  function commit(text: string) {
    setDraft(null);
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) onChange(clamp(n));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (e.key === "Enter") {
      input.blur();
    } else if (e.key === "Escape") {
      // Handled here, so a dialog around this doesn't close too
      e.preventDefault();
      // Put the old value back first, since blurring applies whatever is in the box
      input.value = String(value);
      input.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      // Step from what's typed, if anything
      const typed = parseInt(input.value, 10);
      const base = Number.isFinite(typed) ? clamp(typed) : value;
      setDraft(null);
      onChange((e.key === "ArrowUp" ? above(base) : below(base)) ?? base);
    }
  }

  return (
    <Stepper
      label={label}
      onPrev={prev !== undefined ? () => onChange(prev) : undefined}
      onNext={next !== undefined ? () => onChange(next) : undefined}
    >
      {/* The dashed underline marks the number as typeable even before hover. It's a
          text decoration rather than a border so it doesn't shift the alignment */}
      <label
        title="Type a value, or use the arrows"
        className={`${slotClass} group cursor-text transition-colors hover:bg-base-content/[0.06] focus-within:bg-base-100 focus-within:ring-1 focus-within:ring-base-content/30`}
      >
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          // Sized to the digits so the number and unit stay centred together
          style={{ width: `${Math.max(text.length, 1)}ch` }}
          className="bg-transparent p-0 text-right underline decoration-base-content/40 decoration-dashed underline-offset-[3px] outline-none group-hover:decoration-base-content/80 focus:no-underline"
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <span className={`text-base-content/50 ${spaced ? "ml-[0.3em]" : ""}`}>{unit}</span>
      </label>
    </Stepper>
  );
}

// Field labels sit a level below the uppercase eyebrows (like "Results for"),
// so they're sentence case, regular weight and fainter, and don't compete
function Field({ label, list, children }: { label: string; list: boolean; children: React.ReactNode }) {
  if (list) {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-base-content/70">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-base-content/45">{label}</span>
      {children}
    </div>
  );
}

/**
 * Resolution, quality and display refresh rate the FPS estimate is for.
 * "row" sits beside a result and wraps when narrow; "list" puts one setting per
 * line with the label on the left, for the settings dialog.
 */
export default function FpsSettingsBar({ settings, layout = "row", className = "" }: {
  settings: FpsSettings;
  layout?: "row" | "list";
  className?: string;
}) {
  const list = layout === "list";
  const { graphics, setGraphics, displayHz, setDisplayHz } = settings;
  const presetIndex = PRESETS.findIndex((p) => p.value === graphics.preset);
  const lowerPreset = PRESETS[presetIndex - 1];
  const higherPreset = PRESETS[presetIndex + 1];

  return (
    <div className={`${list ? "flex flex-col gap-3" : "flex flex-wrap items-end gap-x-3 gap-y-3"} ${className}`}>
      <Field label="Resolution" list={list}>
        <NumberStepper
          label="Resolution"
          unit="p"
          value={graphics.resolution}
          steps={RESOLUTION_STEPS}
          range={RESOLUTION_RANGE}
          onChange={(resolution) => setGraphics({ resolution })}
        />
      </Field>
      <Field label="Quality" list={list}>
        <Stepper
          label="Quality"
          onPrev={lowerPreset && (() => setGraphics({ preset: lowerPreset.value }))}
          onNext={higherPreset && (() => setGraphics({ preset: higherPreset.value }))}
        >
          <span className={slotClass} aria-live="polite">
            {PRESETS[presetIndex].label}
          </span>
        </Stepper>
      </Field>
      <Field label="Display" list={list}>
        <NumberStepper
          label="Refresh rate"
          unit="Hz"
          spaced
          value={displayHz}
          steps={DISPLAY_RATES}
          range={DISPLAY_RANGE}
          onChange={setDisplayHz}
        />
      </Field>
    </div>
  );
}
