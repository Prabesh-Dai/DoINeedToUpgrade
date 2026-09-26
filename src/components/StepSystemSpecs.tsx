"use client";

import { useState, useEffect } from "react";
import { UserSpecs, GameDetails, Platform } from "@/types";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";
import ActionBar from "@/components/ActionBar";
import { LuX, LuCircleCheck, LuTriangleAlert, LuHistory } from "react-icons/lu";
import { savePendingGame } from "@/lib/pendingGameCheck";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting: boolean;
  unmatchedFields: string[];
  game: GameDetails | null;
  platform?: Platform;
  onBack: () => void;
  onConfirm: () => void;
  onScriptImport?: (specs: UserSpecs) => void;
  savedAt?: string | null;
  onClearSaved?: () => void;
  showStorageToast?: boolean;
  onToastShown?: () => void;
  hideBack?: boolean;
  confirmLabel?: string;
}

export default function StepSystemSpecs({
  specs,
  onChange,
  dirty,
  cpuList,
  gpuList,
  detecting,
  unmatchedFields,
  game,
  platform,
  onBack,
  onConfirm,
  onScriptImport,
  savedAt,
  onClearSaved,
  showStorageToast,
  onToastShown,
  hideBack,
  confirmLabel,
}: Props) {
  const [toastVisible, setToastVisible] = useState(!!showStorageToast);
  const [toastExiting, setToastExiting] = useState(false);
  const [highlightEmpty, setHighlightEmpty] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [errorToastExiting, setErrorToastExiting] = useState(false);

  useEffect(() => {
    if (!showStorageToast) return;
    onToastShown?.();
  }, [showStorageToast, onToastShown]);

  useEffect(() => {
    if (!toastVisible || toastExiting) return;
    const dismissTimer = setTimeout(() => setToastExiting(true), 8000);
    return () => clearTimeout(dismissTimer);
  }, [toastVisible, toastExiting]);

  useEffect(() => {
    if (!toastExiting) return;
    const removeTimer = setTimeout(() => {
      setToastVisible(false);
      setToastExiting(false);
    }, 400);
    return () => clearTimeout(removeTimer);
  }, [toastExiting]);

  useEffect(() => {
    if (!errorToastVisible || errorToastExiting) return;
    const timer = setTimeout(() => setErrorToastExiting(true), 4000);
    return () => clearTimeout(timer);
  }, [errorToastVisible, errorToastExiting]);

  useEffect(() => {
    if (!errorToastExiting) return;
    const timer = setTimeout(() => {
      setErrorToastVisible(false);
      setErrorToastExiting(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [errorToastExiting]);

  const emptyFieldNames: string[] = [
    ...(!specs.os.trim() ? ["OS"] : []),
    ...(!specs.cpu.trim() ? ["CPU"] : []),
    ...(!specs.gpu.trim() ? ["GPU"] : []),
    ...(specs.ramGB == null ? ["RAM"] : []),
    ...(specs.storageGB == null ? ["Storage"] : []),
  ];

  const hasEmptyField =
    !specs.os.trim() ||
    !specs.cpu.trim() ||
    !specs.gpu.trim() ||
    specs.ramGB == null ||
    specs.storageGB == null;

  function handleConfirmAttempt() {
    if (hasEmptyField) {
      // Re-trigger shake by toggling highlightEmpty off then on
      setHighlightEmpty(false);
      requestAnimationFrame(() => setHighlightEmpty(true));
      // Show/re-trigger error toast
      setErrorToastExiting(false);
      setErrorToastVisible(true);
      return;
    }
    setHighlightEmpty(false);
    setErrorToastVisible(false);
    onConfirm();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if Enter is pressed and no input/textarea is focused
      if (e.key === "Enter") {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
          handleConfirmAttempt();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, hasEmptyField]);

  function handleScannerDownload() {
    // Save the current game context so we can restore it when returning from scanner
    if (game?.appid && platform) {
      savePendingGame(game.appid, platform, game.name);
    }
  }

  return (
    <>
      <div className="animate-fadeIn flex flex-col gap-5">
        {game && (
          <div className="flex items-center gap-3 sm:gap-4 rounded-md border border-base-content/[0.08] bg-base-100/70 p-2.5 pr-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.headerImage}
              alt=""
              className="h-11 w-[94px] sm:h-12 sm:w-[103px] shrink-0 rounded-sm object-cover bg-base-300"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-base-content/50">Checking compatibility for</p>
              <p className="truncate font-semibold">{game.name}</p>
            </div>
            {!hideBack && (
              <button className="btn btn-ghost btn-sm shrink-0" onClick={onBack}>
                Change
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Confirm your specs</h1>
            <p className="mt-1.5 text-base-content/60">
              We&apos;ll compare these against the game&apos;s requirements.
            </p>
          </div>
          {savedAt && (
            <div className="flex items-center gap-1 text-xs text-base-content/50">
              <LuHistory className="h-3.5 w-3.5" />
              <span>
                Saved{" "}
                {new Date(savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              {onClearSaved && (
                <button className="btn btn-ghost btn-xs gap-1 text-base-content/50" onClick={onClearSaved}>
                  <LuX className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {onScriptImport && <HardwareScanner onImport={onScriptImport} onDownload={handleScannerDownload} />}

        <SystemSpecs
          specs={specs}
          onChange={onChange}
          onSubmit={handleConfirmAttempt}
          dirty={dirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          hideSubmit
          highlightEmpty={highlightEmpty}
        />

        <ActionBar
          onBack={hideBack ? undefined : onBack}
          onNext={handleConfirmAttempt}
          nextLabel={confirmLabel ?? "Check compatibility"}
          hint={<><kbd className="kbd kbd-xs">Enter</kbd> to continue</>}
        />
      </div>

      {(toastVisible || errorToastVisible) && (
        <div className="fixed right-3 sm:right-5 top-20 z-50 flex flex-col gap-2 max-w-[calc(100vw-1.5rem)] sm:max-w-sm">
          {toastVisible && (
            <div className={toastExiting ? "animate-toast-out" : "animate-toast-in"} role="status">
              <div className="toast-card">
                <LuCircleCheck className="h-5 w-5 shrink-0 text-info" />
                <span>Loaded your specs from last time</span>
              </div>
            </div>
          )}

          {errorToastVisible && (
            <div className={errorToastExiting ? "animate-toast-out" : "animate-toast-in"} role="alert">
              <div className="toast-card border-l-[3px] border-l-error">
                <LuTriangleAlert className="h-5 w-5 shrink-0 text-error" />
                <span className="flex-1">Please fill in: {emptyFieldNames.join(", ")}</span>
                <button className="btn btn-ghost btn-xs btn-square shrink-0" onClick={() => setErrorToastExiting(true)} aria-label="Dismiss">
                  <LuX className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
