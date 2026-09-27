export type DetectionSource = "auto" | "script";

export interface UserSpecs {
  os: string;
  cpu: string;
  cpuCores: number | null;
  cpuSpeedGHz: number | null;
  gpu: string;
  ramGB: number | null;
  storageGB: number | null;
  detectionSource?: DetectionSource;
  ramApproximate?: boolean;
  guessedFields?: string[];
  manualFields?: string[];
}

export interface GameRequirements {
  os: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
}

export interface ParsedGameRequirements {
  minimum: GameRequirements | null;
  recommended: GameRequirements | null;
}

export type Platform = "windows" | "macos" | "linux";

export type PlatformRequirements = Partial<Record<Platform, ParsedGameRequirements>>;

export type GameSource = "steam" | "igdb";

export interface GameSearchResult {
  id: number;
  name: string;
  tiny_image: string;
  source: GameSource;
}

export interface GameDetails {
  appid: number;
  name: string;
  headerImage: string;
  requirements: ParsedGameRequirements;
  platformRequirements: PlatformRequirements;
  availablePlatforms: Platform[];
  source?: GameSource;
}

export type ComparisonStatus = "pass" | "warn" | "fail" | "info";

export type OverallVerdict = "pass" | "minimum" | "fail" | "unknown";
export interface UpgradeItem {
  component: string;
  current: string;
  required: string;
}

export interface VerdictResult {
  verdict: OverallVerdict;
  title: string;
  description: string;
  failedComponents: string[];
  warnComponents: string[];
  upgradeItems: UpgradeItem[];
}

export interface ComparisonItem {
  label: string;
  userValue: string;
  minValue: string;
  recValue: string;
  minStatus: ComparisonStatus;
  recStatus: ComparisonStatus;
}

export interface HardwareScores {
  userGpuScore: number | null;
  recGpuScore: number | null;
  minGpuScore: number | null;
  userCpuScore: number | null;
  recCpuScore: number | null;
  minCpuScore: number | null;
  userRamGB: number | null;
  minRamGB: number | null;
  recRamGB: number | null;
}

export type FpsConfidence = "good" | "limited" | "none";

export interface FpsEstimate {
  low: number;
  high: number;
  mid: number;
  bottleneck: "gpu" | "cpu" | "ram" | "balanced";
  confidence: FpsConfidence;
}

export interface UpgradeOption {
  component: "gpu" | "cpu" | "ram" | "both";
  /** Example part (or RAM size) to upgrade to; null when there's nothing worth suggesting */
  target: string | null;
  /** Estimated FPS after the upgrade */
  fps: number;
  /** FPS gained over the current estimate */
  gain: number;
}

export interface UpgradeImpact {
  bottleneck: FpsEstimate["bottleneck"];
  currentFps: number;
  /** Sorted by gain, biggest first; the "both" option (if any) comes last */
  options: UpgradeOption[];
}

export interface CompareSpecsResult {
  items: ComparisonItem[];
  scores: HardwareScores;
}
