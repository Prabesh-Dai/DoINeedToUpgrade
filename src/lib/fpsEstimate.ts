import { HardwareScores, FpsEstimate, UpgradeImpact, UpgradeOption, VerdictResult, ComparisonItem } from "@/types";
import { upgradeGpus, upgradeCpus } from "@/lib/hardwareData";

const REC_ANCHOR_FPS = 60;
const MIN_ANCHOR_FPS = 30;
const BASELINE_FPS   = 60;
const UNCERTAINTY    = 0.25;
const MAX_FPS        = 300;
// Every SCORE_SCALE points above the recommended spec doubles the predicted FPS,
// and every SCORE_SCALE points below halves it. This handles score-scale compression
// better than a power function: a score ratio of 3x can represent a real-world gap
// of 5x, so basing predictions on the raw score difference is more accurate.
const SCORE_SCALE    = 25;
// Exponent for the soft minimum that combines CPU and GPU. Frames wait on
// whichever part is slower, so the weaker one should dominate. Higher = closer
// to a hard min(). Kept soft because the per-part numbers come from requirement
// lists, which are rough (CPU ones especially). At 2, a much stronger partner
// adds at most ~41%.
const SOFT_MIN_POWER = 2;
// Share of the soft minimum that the CPU side gets. Publishers tend to list
// CPUs well above what the game needs for 60fps, so the CPU estimate runs low
// and counts for less. Equal inputs still give the same value.
const CPU_WEIGHT     = 0.3;
// How lopsided the two sides can be and still count as a good match
// (a ratio of 1.3 is about a 15% FPS gap at SOFT_MIN_POWER 2)
const BALANCED_RATIO = 1.3;
// An example upgrade should be at least this much faster than the user's part.
// Near the top of the list we settle for MIN_UPGRADE_STEP instead.
const UPGRADE_STEP     = 1.25;
const MIN_UPGRADE_STEP = 1.1;

/**
 * Estimate the FPS contribution of a single hardware component.
 *
 * Uses a continuous curve that anchors at 30fps for minimum specs and 60fps
 * for recommended specs (when available). Below minimum, the curve extrapolates
 * downward smoothly rather than using a separate linear formula — this avoids
 * a discontinuity at the min threshold.
 */
function componentFps(
  userScore: number | null,
  minScore: number | null,
  recScore: number | null,
): { fps: number | null; failsMin: boolean } {
  if (userScore === null) return { fps: null, failsMin: false };
  if (minScore === null && recScore === null) return { fps: null, failsMin: false };

  const failsMin = minScore !== null && userScore < minScore;

  if (recScore !== null && minScore !== null) {
    // Two anchors: 30fps at minScore, 60fps at recScore.
    // Solve for base: 60/30 = base^(recScore - minScore) → base = 2^(1/(rec-min))
    // Then fps = 30 * base^(userScore - minScore)
    // This is continuous across the entire range including below minimum.
    const gap = recScore - minScore;
    if (gap > 0) {
      const fps = MIN_ANCHOR_FPS * Math.pow(2, (userScore - minScore) / gap);
      return { fps, failsMin };
    }
    // rec ≈ min — fall through to single-anchor formula
    const fps = REC_ANCHOR_FPS * Math.pow(2, (userScore - recScore) / SCORE_SCALE);
    return { fps, failsMin };
  }

  if (recScore !== null) {
    // Only rec available — anchor at 60fps
    const fps = REC_ANCHOR_FPS * Math.pow(2, (userScore - recScore) / SCORE_SCALE);
    return { fps, failsMin };
  }

  // Only min available — treat minimum as the 60fps reference
  const fps = BASELINE_FPS * Math.pow(2, (userScore - minScore!) / SCORE_SCALE);
  return { fps, failsMin };
}

/**
 * Compute a RAM penalty multiplier (0.4 – 1.0).
 * RAM doesn't scale FPS linearly — it's a cliff: enough RAM = no impact,
 * not enough = severe stuttering from OS paging.
 *
 * - >= recommended (or no req): 1.0 (no penalty)
 * - >= minimum but < recommended: mild penalty scaling linearly (0.85 – 1.0)
 * - < minimum: harsh penalty scaling with the deficit (down to 0.4)
 */
function ramPenalty(
  userGB: number | null,
  minGB: number | null,
  recGB: number | null,
): { multiplier: number; isBottleneck: boolean } {
  if (userGB === null) return { multiplier: 1, isBottleneck: false };

  const effectiveMin = minGB;
  const effectiveRec = recGB ?? minGB;

  // No RAM requirements listed — no penalty
  if (effectiveMin === null && effectiveRec === null) return { multiplier: 1, isBottleneck: false };

  if (effectiveRec !== null && userGB >= effectiveRec) {
    return { multiplier: 1, isBottleneck: false };
  }

  if (effectiveMin !== null && userGB < effectiveMin) {
    // Below minimum — harsh penalty. At 50% of minimum → 0.4x, at 100% → 0.85x
    const ratio = Math.max(userGB / effectiveMin, 0);
    const mult = 0.4 + 0.45 * ratio;
    return { multiplier: mult, isBottleneck: true };
  }

  if (effectiveMin !== null && effectiveRec !== null && effectiveRec > effectiveMin) {
    // Between min and rec — mild penalty (0.85 at min, 1.0 at rec)
    const t = (userGB - effectiveMin) / (effectiveRec - effectiveMin);
    const mult = 0.85 + 0.15 * t;
    return { multiplier: mult, isBottleneck: false };
  }

  // Has min but no rec, and user meets min
  return { multiplier: 1, isBottleneck: false };
}

export function estimateFps(scores: HardwareScores): FpsEstimate {
  const useRec = scores.recGpuScore !== null || scores.recCpuScore !== null;
  const useMin = scores.minGpuScore !== null || scores.minCpuScore !== null;

  if (!useRec && !useMin) return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };

  const gpu = componentFps(scores.userGpuScore, scores.minGpuScore, scores.recGpuScore);
  const cpu = componentFps(scores.userCpuScore, scores.minCpuScore, scores.recCpuScore);

  const fpsByGpu = gpu.fps;
  const fpsByCpu = cpu.fps;

  if (fpsByGpu === null && fpsByCpu === null) {
    return { low: 0, high: 0, mid: 0, bottleneck: "balanced", confidence: "none" };
  }

  const confidence = useRec
    ? (scores.recGpuScore !== null && scores.recCpuScore !== null ? "good" : "limited")
    : "limited";

  let mid: number;
  let bottleneck: FpsEstimate["bottleneck"];
  const anyFailsMin = gpu.failsMin || cpu.failsMin;

  if (fpsByGpu !== null && fpsByCpu !== null) {
    if (anyFailsMin) {
      // A component below minimum is the hard bottleneck — a great GPU/CPU
      // can't compensate, so use min() rather than geometric mean
      mid = Math.min(fpsByGpu, fpsByCpu);
      bottleneck = fpsByGpu <= fpsByCpu ? "gpu" : "cpu";
    } else {
      // Both pass — weighted soft minimum: the slower part sets the pace, but
      // a much faster partner still helps a little.
      const gpuTerm = (1 - CPU_WEIGHT) * Math.pow(fpsByGpu, -SOFT_MIN_POWER);
      const cpuTerm = CPU_WEIGHT * Math.pow(fpsByCpu, -SOFT_MIN_POWER);
      mid = Math.pow(gpuTerm + cpuTerm, -1 / SOFT_MIN_POWER);
      // The bigger term is the one dragging the result down
      bottleneck = Math.max(gpuTerm, cpuTerm) / Math.min(gpuTerm, cpuTerm) <= BALANCED_RATIO
        ? "balanced" : gpuTerm > cpuTerm ? "gpu" : "cpu";
    }
  } else if (fpsByGpu !== null) {
    mid = fpsByGpu;
    bottleneck = "gpu";
  } else {
    mid = fpsByCpu!;
    bottleneck = "cpu";
  }

  // Apply RAM penalty — insufficient RAM causes paging which tanks performance
  const ram = ramPenalty(scores.userRamGB, scores.minRamGB, scores.recRamGB);
  mid *= ram.multiplier;

  // RAM becomes the declared bottleneck if it's the dominant limiter
  if (ram.isBottleneck) {
    // Only override if RAM penalty is worse than the CPU/GPU bottleneck effect
    const cpuGpuMin = Math.min(fpsByGpu ?? Infinity, fpsByCpu ?? Infinity);
    if (ram.multiplier * cpuGpuMin < cpuGpuMin) {
      bottleneck = "ram";
    }
  }

  mid = Math.min(mid, MAX_FPS);
  return {
    low: Math.max(1, Math.floor(mid * (1 - UNCERTAINTY))),
    high: Math.ceil(mid * (1 + UNCERTAINTY)),
    mid: Math.round(mid),
    bottleneck,
    confidence,
  };
}

/**
 * Why the FPS estimate should be hidden by default, if at all. It can't be
 * trusted when the PC fails the minimum or the requirements are for another OS.
 */
export function fpsHiddenReason(
  verdict: VerdictResult | null,
  comparison: ComparisonItem[] | null,
): "os" | "fail" | null {
  const osMismatch = comparison?.some(
    (item) => item.label === "Operating System" && item.minStatus === "warn"
  ) ?? false;
  if (osMismatch) return "os";
  if (verdict?.verdict === "fail") return "fail";
  return null;
}

/** "NVIDIA GeForce RTX 5060" -> "RTX 5060", "AMD Ryzen 5 7600" -> "Ryzen 5 7600" */
export function shortName(name: string): string {
  return name.replace(/^(NVIDIA GeForce|AMD Radeon|AMD|Intel)\s+/, "");
}

/**
 * Slowest example part that is a clear step up from the user's. If nothing is
 * that much faster, the fastest part that is still a real step up.
 * Parts from `preferVendor` win when one qualifies, since switching CPU
 * brands means a new motherboard too.
 */
function pickUpgrade(
  userScore: number,
  recScore: number | null,
  candidates: string[],
  scoreTable: Record<string, number>,
  preferVendor: string | null = null,
): { name: string; score: number } | null {
  const pool = candidates
    .filter((name) => scoreTable[name] != null)
    .map((name) => ({ name, score: scoreTable[name] }))
    .sort((a, b) => a.score - b.score);
  const prefer = (list: typeof pool) =>
    (preferVendor ? list.find((c) => c.name.startsWith(preferVendor)) : undefined) ?? list[0] ?? null;

  const bar = Math.max(recScore ?? 0, userScore * UPGRADE_STEP);
  const clearing = pool.filter((c) => c.score >= bar);
  if (clearing.length > 0) return prefer(clearing);

  const fastestFirst = pool.filter((c) => c.score >= userScore * MIN_UPGRADE_STEP).reverse();
  return prefer(fastestFirst);
}

function cpuVendor(cpu: string): string | null {
  if (/intel|core\s+(i\d|ultra)/i.test(cpu)) return "Intel";
  if (/amd|ryzen/i.test(cpu)) return "AMD";
  return null;
}

/**
 * Estimate how much FPS each upgrade would add, by rerunning the estimate
 * with one part swapped for an example upgrade. Only works when we know the
 * user's CPU and GPU and the game lists both recommended parts.
 */
export function estimateUpgrades(
  scores: HardwareScores,
  userCpu: string,
  cpuScores: Record<string, number>,
  gpuScores: Record<string, number>,
): UpgradeImpact | null {
  const current = estimateFps(scores);
  if (current.confidence !== "good") return null;
  if (scores.userGpuScore === null || scores.userCpuScore === null) return null;

  const gain = (next: HardwareScores) => {
    const fps = estimateFps(next).mid;
    return { fps, gain: Math.max(0, fps - current.mid) };
  };

  const gpuPick = pickUpgrade(scores.userGpuScore, scores.recGpuScore, upgradeGpus, gpuScores);
  const cpuPick = pickUpgrade(scores.userCpuScore, scores.recCpuScore, upgradeCpus, cpuScores, cpuVendor(userCpu));

  const options: UpgradeOption[] = [
    gpuPick
      ? { component: "gpu", target: shortName(gpuPick.name), ...gain({ ...scores, userGpuScore: gpuPick.score }) }
      : { component: "gpu", target: null, fps: current.mid, gain: 0 },
    cpuPick
      ? { component: "cpu", target: shortName(cpuPick.name), ...gain({ ...scores, userCpuScore: cpuPick.score }) }
      : { component: "cpu", target: null, fps: current.mid, gain: 0 },
  ];

  // RAM only matters when there's less than the game asks for
  const ramTarget = scores.recRamGB ?? scores.minRamGB;
  if (scores.userRamGB !== null && ramTarget !== null) {
    options.push(scores.userRamGB < ramTarget
      ? { component: "ram", target: `${ramTarget} GB`, ...gain({ ...scores, userRamGB: ramTarget }) }
      : { component: "ram", target: null, fps: current.mid, gain: 0 });
  }

  options.sort((a, b) => b.gain - a.gain);

  // When CPU and GPU are evenly matched, upgrading one barely helps, so show both together
  if (current.bottleneck === "balanced" && gpuPick && cpuPick) {
    options.push({
      component: "both",
      target: `${shortName(gpuPick.name)} and ${shortName(cpuPick.name)}`,
      ...gain({ ...scores, userGpuScore: gpuPick.score, userCpuScore: cpuPick.score }),
    });
  }

  return { bottleneck: current.bottleneck, currentFps: current.mid, options };
}
