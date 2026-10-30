"use client";

import { useSyncExternalStore } from "react";
import { GraphicsSettings, QualityPreset } from "@/types";
import { DEFAULT_GRAPHICS } from "@/lib/fpsEstimate";

const STORAGE_KEY = "fpsSettings";
// Assumed when the display can't be measured: a typical gaming monitor
export const FALLBACK_HZ = 144;
// A measurement snaps to the nearest of these when it's close
const KNOWN_RATES = [60, 75, 90, 100, 120, 144, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500];
const SAMPLE_FRAMES = 90;
// Page load is busy enough to drop frames, so wait before measuring
const MEASURE_DELAY_MS = 1000;

// Common values the steppers move between; any value in the range can be typed
export const RESOLUTION_STEPS = [720, 900, 1080, 1440, 1600, 2160];
export const RESOLUTION_RANGE = { min: 480, max: 4320 };
export const DISPLAY_RATES = [60, 75, 100, 120, 144, 165, 180, 240, 360];
export const DISPLAY_RANGE = { min: 30, max: 540 };

export const PRESETS: { value: QualityPreset; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "ultra", label: "Ultra" },
];

/** 1440 -> "1440p", 2160 -> "4K" */
export function resolutionLabel(height: number): string {
  return height === 2160 ? "4K" : `${height}p`;
}

interface Saved {
  graphics: GraphicsSettings;
  /** null = use the measured rate */
  displayHz: number | null;
}

interface StoreState {
  saved: Saved;
  /** Measured refresh rate of this screen; null until measured or when it can't be */
  detectedHz: number | null;
}

const DEFAULT_SAVED: Saved = { graphics: DEFAULT_GRAPHICS, displayHz: null };
const SERVER_STATE: StoreState = { saved: DEFAULT_SAVED, detectedHz: null };

/**
 * Display refresh rate from requestAnimationFrame timing. Uses the mean of the
 * middle half of frame gaps, which ignores dropped frames and evens out
 * browsers that round timestamps to the millisecond.
 */
function measureRefreshRate(onResult: (hz: number | null) => void) {
  const stamps: number[] = [];
  requestAnimationFrame(function tick(now) {
    stamps.push(now);
    if (stamps.length <= SAMPLE_FRAMES) {
      requestAnimationFrame(tick);
      return;
    }
    const gaps = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
    const middle = gaps.slice(Math.floor(gaps.length / 4), Math.ceil((gaps.length * 3) / 4));
    const hz = 1000 / (middle.reduce((sum, g) => sum + g, 0) / middle.length);
    // Under 50 means the browser is throttling (battery saver), not the real rate
    if (!(hz >= 50)) return onResult(null);
    const nearest = KNOWN_RATES.reduce((best, r) => (Math.abs(r - hz) < Math.abs(best - hz) ? r : best));
    onResult(Math.abs(nearest - hz) / hz < 0.08 ? nearest : Math.round(hz));
  });
}

function isGraphics(value: unknown): value is GraphicsSettings {
  const g = value as GraphicsSettings | null;
  return !!g
    && typeof g.resolution === "number"
    && g.resolution >= RESOLUTION_RANGE.min && g.resolution <= RESOLUTION_RANGE.max
    && PRESETS.some((p) => p.value === g.preset);
}

function readSaved(): Saved {
  try {
    const saved: Partial<Saved> | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      graphics: isGraphics(saved?.graphics) ? saved.graphics : DEFAULT_GRAPHICS,
      displayHz: typeof saved?.displayHz === "number"
        && saved.displayHz >= DISPLAY_RANGE.min && saved.displayHz <= DISPLAY_RANGE.max
        ? saved.displayHz : null,
    };
  } catch {
    return DEFAULT_SAVED;
  }
}

// One store for the page, so the settings menu and the results stay in step.
// `state` is replaced (never mutated) on every change, as useSyncExternalStore needs.
let state: StoreState | null = null;
let measureStarted = false;
const listeners = new Set<() => void>();

function getState(): StoreState {
  if (!state) state = { saved: readSaved(), detectedHz: null };
  return state;
}

function setState(next: StoreState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function updateSaved(change: (prev: Saved) => Saved) {
  const saved = change(getState().saved);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // ignore
  }
  setState({ ...getState(), saved });
}

// Another tab changed the settings
function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY) setState({ ...getState(), saved: readSaved() });
}

function startMeasuring() {
  if (measureStarted) return;
  measureStarted = true;
  // On a phone or tablet the screen isn't the one the game will run on
  if (window.matchMedia("(pointer: coarse)").matches) return;
  setTimeout(() => {
    measureRefreshRate((hz) => setState({ ...getState(), detectedHz: hz }));
  }, MEASURE_DELAY_MS);
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  startMeasuring();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Which resolution and preset to estimate FPS for, and the display refresh
 * rate that counts as "enough FPS". Saved across visits, and shared by every
 * component that uses it.
 */
export function useFpsSettings() {
  const { saved, detectedHz } = useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
  return {
    graphics: saved.graphics,
    /** Merges into the current settings, so back-to-back changes don't undo each other */
    setGraphics: (change: Partial<GraphicsSettings>) =>
      updateSaved((prev) => ({ ...prev, graphics: { ...prev.graphics, ...change } })),
    displayHz: saved.displayHz ?? detectedHz ?? FALLBACK_HZ,
    /** null = follow the measured rate */
    setDisplayHz: (hz: number | null) => updateSaved((prev) => ({ ...prev, displayHz: hz })),
    /** True when the display rate follows the measurement rather than a chosen value */
    displayHzIsAuto: saved.displayHz === null,
    detectedHz,
    reset: () => updateSaved(() => DEFAULT_SAVED),
  };
}

export type FpsSettings = ReturnType<typeof useFpsSettings>;
