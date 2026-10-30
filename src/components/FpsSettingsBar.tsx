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

// "sm" fits beside a result; "md" is the roomier size for the settings dialog
type Size = "sm" | "md";

const sizes: Record<Size, { arrow: string; icon: string; slot: string }> = {
  sm: { arrow: "h-6 w-6", icon: "h-3.5 w-3.5", slot: "h-6 w-16 text-xs" },
  md: { arrow: "h-9 w-9", icon: "h-4 w-4", slot: "h-9 w-24 text-sm" },
};

const arrowClass =
  "grid place-items-center rounded-sm text-base-content/60 transition-colors hover:bg-base-content/[0.08] hover:text-base-content disabled:pointer-events-none disabled:opacity-30";

// Every stepper's value sits in the same fixed slot, so the three controls
// match in width and their values line up on the same centre
const slotClass = "flex items-center justify-center rounded-sm font-semibold tabular-nums";

/** ‹ value › control. An arrow is disabled when its handler is missing */
function Stepper({ label, size, onPrev, onNext, children }: {
  label: string;
  size: Size;
  onPrev?: () => void;
  onNext?: () => void;
  children: React.ReactNode;
}) {
  const s = sizes[size];
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit shrink-0 items-center rounded bg-base-content/[0.06] p-0.5">
      <button type="button" className={`${arrowClass} ${s.arrow}`} aria-label={`Lower ${label.toLowerCase()}`} disabled={!onPrev} onClick={onPrev}>
        <LuChevronLeft className={s.icon} />
      </button>
      {children}
      <button type="button" className={`${arrowClass} ${s.arrow}`} aria-label={`Higher ${label.toLowerCase()}`} disabled={!onNext} onClick={onNext}>
        <LuChevronRight className={s.icon} />
      </button>
    </div>
  );
}

/**
 * Stepper with a typeable number. The arrows (and the Up/Down keys) move to the
 * next common value; typing sets any value in range, applied on Enter or blur.
 */
function NumberStepper({ label, size, unit, spaced = false, value, steps, range, onChange }: {
  label: string;
  size: Size;
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
      size={size}
      onPrev={prev !== undefined ? () => onChange(prev) : undefined}
      onNext={next !== undefined ? () => onChange(next) : undefined}
    >
      {/* The dashed underline marks the number as typeable even before hover. It's a
          text decoration rather than a border so it doesn't shift the alignment */}
      <label
        title="Type a value, or use the arrows"
        className={`${slotClass} ${sizes[size].slot} group cursor-text transition-colors hover:bg-base-content/[0.06] focus-within:bg-base-100 focus-within:ring-1 focus-within:ring-base-content/30`}
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

// Beside a result, field labels sit a level below the uppercase eyebrows (like
// "Results for"), so they're small and faint. In the dialog they're the main
// text of each row, with an optional hint underneath.
function Field({ label, hint, list, children }: {
  label: string;
  hint?: React.ReactNode;
  list: boolean;
  children: React.ReactNode;
}) {
  if (list) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-base-content/50">{hint}</p>}
        </div>
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
 * line with larger controls, for the settings dialog.
 */
export default function FpsSettingsBar({ settings, layout = "row", displayHint, className = "" }: {
  settings: FpsSettings;
  layout?: "row" | "list";
  /** Shown under the Display label in the list layout */
  displayHint?: React.ReactNode;
  className?: string;
}) {
  const list = layout === "list";
  const size: Size = list ? "md" : "sm";
  const { graphics, setGraphics, displayHz, setDisplayHz } = settings;
  const presetIndex = PRESETS.findIndex((p) => p.value === graphics.preset);
  const lowerPreset = PRESETS[presetIndex - 1];
  const higherPreset = PRESETS[presetIndex + 1];

  return (
    <div className={`${list ? "flex flex-col gap-5" : "flex flex-wrap items-end gap-x-3 gap-y-3"} ${className}`}>
      <Field label="Resolution" list={list}>
        <NumberStepper
          label="Resolution"
          size={size}
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
          size={size}
          onPrev={lowerPreset && (() => setGraphics({ preset: lowerPreset.value }))}
          onNext={higherPreset && (() => setGraphics({ preset: higherPreset.value }))}
        >
          <span className={`${slotClass} ${sizes[size].slot}`} aria-live="polite">
            {PRESETS[presetIndex].label}
          </span>
        </Stepper>
      </Field>
      <Field label="Display" hint={displayHint} list={list}>
        <NumberStepper
          label="Refresh rate"
          size={size}
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
