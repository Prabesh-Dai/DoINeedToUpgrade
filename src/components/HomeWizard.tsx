"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UserSpecs, GameDetails, GameRequirements, ComparisonItem, Platform, GameSource, HardwareScores } from "@/types";
import { LuCircleCheck, LuX } from "react-icons/lu";
import { compareSpecs } from "@/lib/compareSpecs";
import { estimateFps, estimateUpgrades } from "@/lib/fpsEstimate";
import { computeVerdict } from "@/lib/computeVerdict";
import { useBenchmarks } from "@/lib/useBenchmarks";
import { detectClientSpecs } from "@/lib/detectClientSpecs";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";
import { decodeSpecsPayload } from "@/lib/decodeSpecsPayload";
import { track } from "@vercel/analytics";
import { getPendingGame, clearPendingGame, savePendingGame } from "@/lib/pendingGameCheck";
import { parseGameParams, ScannerGame } from "@/lib/scannerGameParam";
import WizardStepper from "@/components/WizardStepper";
import StepGameSelect from "@/components/StepGameSelect";
import StepSystemSpecs from "@/components/StepSystemSpecs";
import StepResults from "@/components/StepResults";
import RequirementsEditor from "@/components/RequirementsEditor";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";
import ActionBar from "@/components/ActionBar";

const defaultSpecs: UserSpecs = {
  os: "",
  cpu: "",
  cpuCores: null,
  cpuSpeedGHz: null,
  gpu: "",
  ramGB: null,
  storageGB: null,
};

const emptyReqs: GameRequirements = {
  os: "",
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
};

function detectPlatformFromOS(os: string): Platform {
  const lower = os.toLowerCase();
  if (lower.includes("mac")) return "macos";
  if (lower.includes("linux")) return "linux";
  return "windows";
}

function hasAnyField(reqs: GameRequirements): boolean {
  return Object.values(reqs).some((v) => v.trim() !== "");
}

function Home() {
  const searchParams = useSearchParams();
  const { cpuList, gpuList, cpuScores, gpuScores } = useBenchmarks();
  const [specs, setSpecs] = useState<UserSpecs>(defaultSpecs);
  const [detecting, setDetecting] = useState(true);
  const [unmatchedFields, setUnmatchedFields] = useState<string[]>([]);

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [specsConfirmed, setSpecsConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [game, setGame] = useState<GameDetails | null>(null);
  const [minReqs, setMinReqs] = useState<GameRequirements>(emptyReqs);
  const [recReqs, setRecReqs] = useState<GameRequirements>(emptyReqs);
  const [comparison, setComparison] = useState<ComparisonItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specsDirty, setSpecsDirty] = useState(false);
  const [platform, setPlatform] = useState<Platform>("windows");
  const [userPlatform, setUserPlatform] = useState<Platform>("windows");
  const [showStorageToast, setShowStorageToast] = useState(false);
  const [showUrlImportToast, setShowUrlImportToast] = useState(false);
  const [importedFromScanner, setImportedFromScanner] = useState(false);
  const [lastGameSource, setLastGameSource] = useState<GameSource>("steam");
  const [hardwareScores, setHardwareScores] = useState<HardwareScores | null>(null);

  // Auto-dismiss URL import toast
  useEffect(() => {
    if (!showUrlImportToast) return;
    const timer = setTimeout(() => setShowUrlImportToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showUrlImportToast]);

  // After a scanner import, go straight to results for the game the user had picked:
  // carried in the return URL by the scripts, or remembered locally for the downloaded apps.
  // With no game (or if it fails to load), fall back to scanner mode: specs first, then pick a game.
  async function resumeAfterImport(imported: UserSpecs, detected: Platform, returnGame: ScannerGame | null) {
    const pending = getPendingGame();
    clearPendingGame();
    const target = returnGame ?? (pending ? { appid: pending.appid, source: pending.source } : null);
    if (!target) {
      setImportedFromScanner(true);
      return;
    }

    try {
      const params = new URLSearchParams({ appid: String(target.appid), source: target.source });
      const res = await fetch(`/api/game?${params}`);
      if (!res.ok) throw new Error("Failed to load game details");
      const data: GameDetails = await res.json();
      setGame(data);
      setLastGameSource(target.source);

      const selectedPlatform = data.availablePlatforms.includes(detected)
        ? detected
        : data.availablePlatforms[0] ?? "windows";
      setPlatform(selectedPlatform);

      const platformReqs = data.platformRequirements[selectedPlatform] ?? data.requirements;
      const newMin = platformReqs.minimum ?? { ...emptyReqs };
      const newRec = platformReqs.recommended ?? { ...emptyReqs };
      setMinReqs(newMin);
      setRecReqs(newRec);

      const minArg = hasAnyField(newMin) ? newMin : null;
      const recArg = hasAnyField(newRec) ? newRec : null;
      const { items: compItems, scores } = compareSpecs(imported, minArg, recArg, cpuScores, gpuScores);
      setComparison(compItems);
      setHardwareScores(scores);
      setSpecsConfirmed(true);
      setSpecsDirty(false);
      setStep(3);
      setMaxReached(3);
      setImportedFromScanner(false);
    } catch {
      setImportedFromScanner(true);
    }
  }

  // Load specs from URL params, localStorage, or detect automatically
  useEffect(() => {
    // Read before the URL gets cleaned up below
    const returnGame = parseGameParams(searchParams);

    // Priority 1: Check URL params for specs (from the scanner app or terminal script)
    const urlSpecs = searchParams.get("specs");
    if (urlSpecs) {
      // Add DINAU: prefix since URL only contains the base64 part.
      // The apps don't percent-encode it, so any "+" arrives as a space; base64 never has spaces.
      const decoded = decodeSpecsPayload(`DINAU:${urlSpecs.replace(/ /g, "+")}`);
      if (decoded) {
        setSpecs(decoded);
        track("scanner_import", { via: searchParams.get("via") === "script" ? "script" : "app" });
        const now = new Date().toISOString();
        setSavedAt(now);
        localStorage.setItem("savedSpecs", JSON.stringify({ specs: decoded, savedAt: now }));
        const detected = detectPlatformFromOS(decoded.os || "");
        setPlatform(detected);
        setUserPlatform(detected);
        setUnmatchedFields([]);
        setDetecting(false);
        setShowUrlImportToast(true);

        // Clean up URL without reload
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("specs");
          window.history.replaceState({}, "", url.pathname);
        }

        resumeAfterImport(decoded, detected, returnGame);
        return;
      }
    }

    // Priority 2: Check localStorage for saved specs
    let hasSaved = false;
    try {
      const raw = localStorage.getItem("savedSpecs");
      if (raw) {
        const { specs: saved, savedAt: date } = JSON.parse(raw);
        if (saved) {
          setSpecs(saved);
          setSavedAt(date ?? null);
          hasSaved = true;
          setShowStorageToast(true);
          // Set platform from saved OS
          const detected = detectPlatformFromOS(saved.os || "");
          setPlatform(detected);
          setUserPlatform(detected);
          setDetecting(false);
        }
      }
    } catch {
      // ignore corrupt data
    }


    // Priority 3: Auto-detect specs
    if (!hasSaved) {
      detectClientSpecs(gpuList)
        .then(async (data) => {
          setSpecs(data);
          const detected = detectPlatformFromOS(data.os);
          setPlatform(detected);
          setUserPlatform(detected);
          const unmatched: string[] = [];
          if (!data.cpu || (cpuList.length > 0 && !fuzzyMatchHardware(data.cpu, cpuList))) {
            unmatched.push("CPU");
          }
          if (data.gpu && gpuList.length > 0 && !fuzzyMatchHardware(data.gpu, gpuList)) {
            unmatched.push("GPU");
          }
          if (!data.ramGB || data.ramGB === 8) unmatched.push("RAM");
          unmatched.push("Storage");
          // Merge guessed fields — these have values but need user confirmation
          if (data.guessedFields) {
            for (const f of data.guessedFields) {
              if (!unmatched.includes(f)) unmatched.push(f);
            }
          }
          setUnmatchedFields(unmatched);
        })
        .catch(() => {})
        .finally(() => setDetecting(false));
    }
  }, [cpuList, gpuList, searchParams]);

  // Handle ?game= parameter from game page CTA
  useEffect(() => {
    // Scanner return URLs also carry ?game=; the import flow above handles those
    if (searchParams.get("specs")) return;
    const gameParam = searchParams.get("game");
    if (gameParam && /^\d+$/.test(gameParam)) {
      // Clean up URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("game");
        window.history.replaceState({}, "", url.pathname + url.search || "/");
      }
      handleGameSelect(Number(gameParam), "steam");
    }
  }, [searchParams]);

  // Global "/" shortcut to focus game search input (or navigate there from results)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const gameSearchStep = importedFromScanner ? 2 : 1;

        if (step === 3) {
          // Navigate back to game search (same as "Check Another Game")
          handleCheckAnother();
          // Focus input after component mounts
          requestAnimationFrame(() => {
            document.getElementById("game-search-input")?.focus();
          });
        } else if (step === gameSearchStep && !manualMode) {
          document.getElementById("game-search-input")?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [step, importedFromScanner, manualMode]);

  // The <main> element is the scroll container; reset it so each step starts at the top
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [step, manualMode]);

  const verdict = comparison ? computeVerdict(comparison) : null;
  const fpsEstimate = hardwareScores ? estimateFps(hardwareScores) : null;
  const upgradeImpact = hardwareScores ? estimateUpgrades(hardwareScores, specs.cpu, cpuScores, gpuScores) : null;

  const runComparison = useCallback(
    (min?: GameRequirements, rec?: GameRequirements) => {
      const minR = min ?? minReqs;
      const recR = rec ?? recReqs;
      const minArg = hasAnyField(minR) ? minR : null;
      const recArg = hasAnyField(recR) ? recR : null;
      const { items: compItems, scores } = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores);
      setComparison(compItems);
      setHardwareScores(scores);
      setSpecsDirty(false);
    },
    [specs, minReqs, recReqs, cpuScores, gpuScores]
  );

  function goToStep(s: number) {
    setStep(s);
    setMaxReached((prev) => Math.max(prev, s));
  }

  function evaluateUnmatched(s: UserSpecs) {
    const unmatched: string[] = [];
    if (!s.cpu || (cpuList.length > 0 && !fuzzyMatchHardware(s.cpu, cpuList))) unmatched.push("CPU");
    if (s.gpu && gpuList.length > 0 && !fuzzyMatchHardware(s.gpu, gpuList)) unmatched.push("GPU");
    if (!s.ramGB || s.ramGB === 8) unmatched.push("RAM");
    unmatched.push("Storage");
    setUnmatchedFields(unmatched);
  }

  function handleSpecsChange(newSpecs: UserSpecs) {
    setSpecs(newSpecs);
    setSpecsDirty(true);
    evaluateUnmatched(newSpecs);
  }

  async function handleGameSelect(id: number, source: GameSource = "steam") {
    setLoading(true);
    setError(null);
    setGame(null);
    setComparison(null);
    setManualMode(false);
    setLastGameSource(source);

    try {
      const params = new URLSearchParams({ appid: String(id), source });
      const res = await fetch(`/api/game?${params}`);
      if (!res.ok) throw new Error("Failed to load game details");

      const data = await res.json();
      setGame(data as GameDetails);
      savePendingGame(id, source, data.name);

      // Auto-select platform: prefer user's OS, fall back to first available
      const selectedPlatform = data.availablePlatforms.includes(userPlatform)
        ? userPlatform
        : data.availablePlatforms[0] ?? "windows";
      setPlatform(selectedPlatform);

      const platformReqs = data.platformRequirements[selectedPlatform] ?? data.requirements;
      const newMin = platformReqs.minimum ?? { ...emptyReqs };
      const newRec = platformReqs.recommended ?? { ...emptyReqs };
      setMinReqs(newMin);
      setRecReqs(newRec);

      // In scanner mode, specs are already confirmed, so go directly to results
      if (importedFromScanner || specsConfirmed) {
        const minArg = hasAnyField(newMin) ? newMin : null;
        const recArg = hasAnyField(newRec) ? newRec : null;
        const { items: compItems, scores } = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores);
        setComparison(compItems);
        setHardwareScores(scores);
        setSpecsDirty(false);
        goToStep(3);
      } else {
        goToStep(2);
      }
    } catch {
      setError("Failed to load game requirements. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleManualMode() {
    clearPendingGame();
    setManualMode(true);
    setGame(null);
    setMinReqs({ ...emptyReqs });
    setRecReqs({ ...emptyReqs });
    setComparison(null);
    // In scanner mode, we're already at step 2 (game select); stay there
    // In normal mode, go to step 2 (which is system specs / manual entry)
    if (!importedFromScanner) {
      goToStep(2);
    }
  }

  function handleSpecsConfirm() {
    setSpecsConfirmed(true);
    const now = new Date().toISOString();
    setSavedAt(now);
    localStorage.setItem("savedSpecs", JSON.stringify({ specs, savedAt: now }));
    runComparison();
    goToStep(3);
  }

  function handleSpecsConfirmForScanner() {
    setSpecsConfirmed(true);
    const now = new Date().toISOString();
    setSavedAt(now);
    localStorage.setItem("savedSpecs", JSON.stringify({ specs, savedAt: now }));
    goToStep(2); // Go to game select (step 2 in scanner mode)
  }

  function handleCheckAnother() {
    clearPendingGame();
    setGame(null);
    setComparison(null);
    setHardwareScores(null);
    setMinReqs({ ...emptyReqs });
    setRecReqs({ ...emptyReqs });
    setManualMode(false);
    // In scanner mode, go to step 2 (game select); in normal mode, go to step 1 (game select)
    if (importedFromScanner) {
      goToStep(2);
      setMaxReached(2);
    } else {
      goToStep(1);
      setMaxReached(1);
    }
  }

  function handleScriptImport(importedSpecs: UserSpecs) {
    setSpecs(importedSpecs);
    setUnmatchedFields([]);
    setSpecsDirty(true);
    const now = new Date().toISOString();
    setSavedAt(now);
    localStorage.setItem("savedSpecs", JSON.stringify({ specs: importedSpecs, savedAt: now }));
  }

  function handleClearSavedSpecs() {
    localStorage.removeItem("savedSpecs");
    setSavedAt(null);
    setSpecs(defaultSpecs);
    setDetecting(true);
    detectClientSpecs(gpuList)
      .then((data) => {
        setSpecs(data);
        evaluateUnmatched(data);
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  }

  function handleEditSpecs() {
    // In scanner mode, go to step 1 (Your System)
    // In normal mode, go to step 2 (Your System)
    goToStep(importedFromScanner ? 1 : 2);
  }

  function handleRequirementsChange(min: GameRequirements, rec: GameRequirements) {
    setMinReqs(min);
    setRecReqs(rec);
    runComparison(min, rec);
  }

  function handlePlatformChange(newPlatform: Platform) {
    if (!game) return;
    setPlatform(newPlatform);
    const platformReqs = game.platformRequirements[newPlatform] ?? game.requirements;
    const newMin = platformReqs.minimum ?? { ...emptyReqs };
    const newRec = platformReqs.recommended ?? { ...emptyReqs };
    setMinReqs(newMin);
    setRecReqs(newRec);
    if (specsConfirmed) {
      const minArg = hasAnyField(newMin) ? newMin : null;
      const recArg = hasAnyField(newRec) ? newRec : null;
      const { items: compItems, scores } = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores);
      setComparison(compItems);
      setHardwareScores(scores);
      setSpecsDirty(false);
    }
  }

  // When imported from scanner: "Your System" → "Pick a Game" → "Results"
  // Normal mode: "Pick a Game" → "Your System" → "Results"
  const stepLabels = importedFromScanner
    ? ["Your System", "Pick a Game", "Results"]
    : ["Pick a Game", "Your System", "Results"];

  // On the landing screen the hero does the explaining; the stepper appears once the flow starts
  const showStepper = importedFromScanner || step > 1;

  return (
    <div className="flex flex-col gap-8">
      {showStepper && (
        <WizardStepper
          currentStep={step}
          onStepClick={goToStep}
          maxReached={maxReached}
          steps={stepLabels}
        />
      )}

      {/* Scanner import mode: Step 1 shows system specs */}
      {importedFromScanner && step === 1 && !manualMode && (
        <StepSystemSpecs
          specs={specs}
          onChange={handleSpecsChange}
          dirty={specsDirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          game={null}
          onBack={() => {}}
          onConfirm={handleSpecsConfirmForScanner}
          savedAt={savedAt}
          onClearSaved={handleClearSavedSpecs}
          showStorageToast={false}
          onToastShown={() => {}}
          hideBack
          confirmLabel="Continue"
        />
      )}

      {/* Scanner import mode: Step 2 shows game search */}
      {importedFromScanner && step === 2 && !manualMode && (
        <StepGameSelect
          onSelect={handleGameSelect}
          onManualMode={handleManualMode}
          loading={loading}
          error={error}
          showInfo={false}

          initialSource={lastGameSource}
        />
      )}

      {/* Scanner import mode: Step 2 manual mode */}
      {importedFromScanner && step === 2 && manualMode && (
        <div className="animate-fadeIn flex flex-col gap-5">
          <ManualHeader />
          <SystemSpecs
            specs={specs}
            onChange={handleSpecsChange}
            onSubmit={handleSpecsConfirm}
            dirty={specsDirty}
            cpuList={cpuList}
            gpuList={gpuList}
            detecting={detecting}
            unmatchedFields={unmatchedFields}
            hideSubmit
          />
          <RequirementsEditor
            minimum={minReqs}
            recommended={recReqs}
            onChange={handleRequirementsChange}
            onSubmit={handleSpecsConfirm}
          />
          <ActionBar
            onBack={() => setManualMode(false)}
            backLabel="Back to search"
            onNext={handleSpecsConfirm}
            nextLabel="Check compatibility"
          />
        </div>
      )}

      {/* Normal mode: Step 1 shows game search only */}
      {!importedFromScanner && step === 1 && (
        <StepGameSelect
          onSelect={handleGameSelect}
          onManualMode={handleManualMode}
          loading={loading}
          error={error}

          initialSource={lastGameSource}
        />
      )}

      {/* Normal mode: Step 2 shows system specs */}
      {!importedFromScanner && step === 2 && !manualMode && (
        <StepSystemSpecs
          specs={specs}
          onChange={handleSpecsChange}
          dirty={specsDirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          game={game}
          onBack={() => goToStep(1)}
          onConfirm={handleSpecsConfirm}
          onScriptImport={handleScriptImport}
          savedAt={savedAt}
          onClearSaved={handleClearSavedSpecs}
          showStorageToast={showStorageToast}
          onToastShown={() => setShowStorageToast(false)}
        />
      )}

      {!importedFromScanner && step === 2 && manualMode && (
        <div className="animate-fadeIn flex flex-col gap-5">
          <ManualHeader />
          <HardwareScanner onImport={handleScriptImport} />
          <SystemSpecs
            specs={specs}
            onChange={handleSpecsChange}
            onSubmit={handleSpecsConfirm}
            dirty={specsDirty}
            cpuList={cpuList}
            gpuList={gpuList}
            detecting={detecting}
            unmatchedFields={unmatchedFields}
            hideSubmit
          />
          <RequirementsEditor
            minimum={minReqs}
            recommended={recReqs}
            onChange={handleRequirementsChange}
            onSubmit={handleSpecsConfirm}
          />
          <ActionBar
            onBack={() => goToStep(1)}
            backLabel="Back"
            onNext={handleSpecsConfirm}
            nextLabel="Check compatibility"
          />
        </div>
      )}

      {/* Results step - always step 3 */}
      {step === 3 && (
        <StepResults
          game={game}
          verdict={verdict}
          comparison={comparison}
          minReqs={minReqs}
          recReqs={recReqs}
          onRequirementsChange={handleRequirementsChange}
          onRerun={() => runComparison()}
          onCheckAnother={handleCheckAnother}
          onEditSpecs={handleEditSpecs}
          platform={platform}
          userPlatform={userPlatform}
          availablePlatforms={game?.availablePlatforms ?? []}
          onPlatformChange={handlePlatformChange}
          fpsEstimate={fpsEstimate}
          upgradeImpact={upgradeImpact}
        />
      )}

      {/* Toast for URL-imported specs */}
      {showUrlImportToast && (
        <div className="fixed right-3 sm:right-5 top-20 z-50 animate-toast-in max-w-[calc(100vw-1.5rem)] sm:max-w-sm" role="status">
          <div className="toast-card">
            <LuCircleCheck className="h-5 w-5 shrink-0 text-success" />
            <span className="flex-1">Specs imported from the scanner</span>
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => setShowUrlImportToast(false)}
              aria-label="Dismiss"
            >
              <LuX className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ManualHeader() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manual check</h1>
      <p className="mt-1.5 text-base-content/60">
        Enter your specs and the game&apos;s requirements yourself.
      </p>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function HomeWizard() {
  return (
    <Suspense fallback={<div className="flex justify-center p-16"><span className="loading loading-spinner loading-md text-primary" /></div>}>
      <Home />
    </Suspense>
  );
}
