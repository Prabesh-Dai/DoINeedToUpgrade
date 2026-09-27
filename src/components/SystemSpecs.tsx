"use client";

import { UserSpecs, DetectionSource } from "@/types";
import AutocompleteInput from "./AutocompleteInput";
import { osList } from "@/lib/hardwareData";
import { LuRotateCcw, LuTriangleAlert, LuInfo, LuCpu, LuMonitor, LuMemoryStick, LuHardDrive, LuLaptop } from "react-icons/lu";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  onSubmit: () => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting?: boolean;
  unmatchedFields?: string[];
  hideSubmit?: boolean;
  highlightEmpty?: boolean;
}

const sourceLabels: Record<DetectionSource, string> = {
  auto: "Detected from your browser. Fix anything that looks off.",
  script: "Detected by the hardware scanner.",
};

// Unmatched field names (as HomeWizard reports them) to the spec keys the user edits
const unmatchedKeys: Record<string, keyof UserSpecs> = {
  CPU: "cpu",
  GPU: "gpu",
  RAM: "ramGB",
  Storage: "storageGB",
};

function Field({
  id,
  icon: Icon,
  label,
  estimated,
  note,
  className = "",
  children,
}: {
  id: string;
  icon: typeof LuCpu;
  label: string;
  estimated?: boolean;
  note?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-base-content/80">
          <Icon className="h-4 w-4 text-base-content/40" />
          {label}
          {note && <span className="font-normal text-base-content/40">{note}</span>}
        </label>
        {estimated && (
          <span className="chip bg-warning text-warning-content">
            Estimated
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function DetectingSpinner() {
  return <span className="loading loading-spinner loading-xs absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />;
}

export default function SystemSpecs({ specs, onChange, onSubmit, dirty, cpuList, gpuList, detecting, unmatchedFields = [], hideSubmit = false, highlightEmpty = false }: Props) {
  const isAuto = specs.detectionSource === "auto";
  const manual = specs.manualFields ?? [];
  const isEstimated = (field: string) => !detecting && isAuto && !manual.includes(field);
  const emptyClass = (isEmpty: boolean) =>
    highlightEmpty && isEmpty ? "!border-error animate-shake" : "";

  const update = (field: keyof UserSpecs, value: string | number | null) => {
    const updated = manual.includes(field) ? manual : [...manual, field];
    onChange({ ...specs, [field]: value, manualFields: updated });
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

  // Fields the user has typed in themselves are no longer estimates
  const edited = (f: string) => manual.includes(unmatchedKeys[f]);
  const uncheckedGuesses = (specs.guessedFields ?? []).filter((f) => !edited(f));
  const nonGuessedUnmatched = unmatchedFields.filter(
    (f) => !specs.guessedFields?.includes(f) && !edited(f)
  );

  return (
    <section className="card w-full max-w-full overflow-visible rounded-md">
      <div className="card-body gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="shrink-0 text-lg font-semibold">Your hardware</h2>
            <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-base-content/15 sm:block" />
            <p className="flex min-w-0 items-center gap-2 text-sm text-base-content/60">
              {detecting ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
                  Detecting your hardware…
                </>
              ) : (
                sourceLabels[specs.detectionSource ?? "auto"]
              )}
            </p>
          </div>
          {!hideSubmit && (
            <button
              className="btn btn-primary btn-sm gap-2"
              onClick={onSubmit}
              disabled={!dirty}
              title="Recheck compatibility"
            >
              <LuRotateCcw className="h-4 w-4" />
              Recheck
            </button>
          )}
        </div>

        {!detecting && isAuto && uncheckedGuesses.length > 0 && (
          <div role="alert" className="notice border-l-info">
            <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <span>
              We estimated your <strong className="text-base-content">{uncheckedGuesses.join(", ")}</strong> from your Mac model.
              Check {uncheckedGuesses.length === 1 ? "it" : "them"} below.
            </span>
          </div>
        )}

        {!detecting && isAuto && nonGuessedUnmatched.length > 0 && (
          <div role="alert" className="notice border-l-warning">
            <LuTriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span>
              Browsers only expose part of your hardware, so some values are estimates.
              For exact specs, use the scanner above.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-6">
          <Field id="spec-cpu" icon={LuCpu} label="Processor" estimated={isEstimated("cpu") && !!specs.cpu} className="md:col-span-3">
            <div className="relative">
              <AutocompleteInput
                id="spec-cpu"
                name="cpu"
                value={specs.cpu}
                onChange={(v) => update("cpu", v)}
                onSubmit={onSubmit}
                options={cpuList}
                placeholder={detecting ? "Detecting…" : (specs.cpu ? "e.g. Intel Core i7-12700K" : "Couldn't detect it. Type your CPU model")}
                disabled={detecting}
                className={emptyClass(!specs.cpu.trim())}
              />
              {detecting && <DetectingSpinner />}
            </div>
          </Field>

          <Field id="spec-gpu" icon={LuMonitor} label="Graphics card" estimated={isEstimated("gpu") && !!specs.gpu} className="md:col-span-3">
            <div className="relative">
              <AutocompleteInput
                id="spec-gpu"
                name="gpu"
                value={specs.gpu}
                onChange={(v) => update("gpu", v)}
                onSubmit={onSubmit}
                options={gpuList}
                placeholder={detecting ? "Detecting…" : "e.g. NVIDIA RTX 4070"}
                disabled={detecting}
                className={emptyClass(!specs.gpu.trim())}
              />
              {detecting && <DetectingSpinner />}
            </div>
          </Field>

          <Field id="spec-os" icon={LuLaptop} label="Operating system" estimated={isEstimated("os") && !!specs.os} className="md:col-span-2">
            <div className="relative">
              <AutocompleteInput
                id="spec-os"
                name="os"
                value={specs.os}
                onChange={(v) => update("os", v)}
                onSubmit={onSubmit}
                options={osList}
                placeholder={detecting ? "Detecting…" : "e.g. Windows 11"}
                disabled={detecting}
                className={emptyClass(!specs.os.trim())}
              />
              {detecting && <DetectingSpinner />}
            </div>
          </Field>

          <Field
            id="spec-ram"
            icon={LuMemoryStick}
            label="Memory"
            note={!detecting && specs.ramApproximate && specs.ramGB != null && !manual.includes("ramGB") ? "approx." : undefined}
            estimated={isEstimated("ramGB") && specs.ramGB != null}
            className="md:col-span-2"
          >
            <div className="relative">
              <input
                id="spec-ram"
                name="ram"
                type="number"
                min={0}
                inputMode="decimal"
                className={`input input-bordered w-full pr-12 tabular-nums ${emptyClass(specs.ramGB == null)}`}
                value={specs.ramGB ?? ""}
                onChange={(e) =>
                  update("ramGB", e.target.value ? parseFloat(e.target.value) : null)
                }
                onKeyDown={handleKeyDown}
                placeholder={detecting ? "Detecting…" : "16"}
                disabled={detecting}
              />
              {detecting ? <DetectingSpinner /> : <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-base-content/40">GB</span>}
            </div>
          </Field>

          <Field
            id="spec-storage"
            icon={LuHardDrive}
            label="Free storage"
            estimated={isEstimated("storageGB")}
            className="md:col-span-2"
          >
            <div className="relative">
              <input
                id="spec-storage"
                name="storage"
                type="number"
                min={0}
                inputMode="decimal"
                className={`input input-bordered w-full pr-12 tabular-nums ${emptyClass(specs.storageGB == null)}`}
                value={specs.storageGB ?? ""}
                onChange={(e) =>
                  update("storageGB", e.target.value ? parseFloat(e.target.value) : null)
                }
                onKeyDown={handleKeyDown}
                placeholder={detecting ? "Detecting…" : "500"}
                disabled={detecting}
              />
              {detecting ? <DetectingSpinner /> : <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-base-content/40">GB</span>}
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}
