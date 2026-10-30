"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import FpsSettingsBar from "@/components/FpsSettingsBar";
import { FALLBACK_HZ, useFpsSettings } from "@/lib/useFpsSettings";

/** Dialog for the resolution, quality and display rate every FPS estimate uses */
export default function FpsSettingsDialog({ onClose }: { onClose: () => void }) {
  const settings = useFpsSettings();
  const { detectedHz, displayHzIsAuto, displayHz, setDisplayHz, reset } = settings;
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    boxRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      // A number field uses Escape to cancel its edit first
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  let displayHint: React.ReactNode = null;
  if (detectedHz !== null && displayHzIsAuto) {
    displayHint = `Matches this screen's ${detectedHz} Hz.`;
  } else if (detectedHz !== null && displayHz !== detectedHz) {
    displayHint = (
      <>
        This screen runs at {detectedHz} Hz.{" "}
        <button type="button" className="font-semibold text-base-content underline underline-offset-2" onClick={() => setDisplayHz(null)}>
          Use that
        </button>
      </>
    );
  } else if (detectedHz === null && displayHzIsAuto) {
    displayHint = `Couldn't measure this screen, so we assume ${FALLBACK_HZ} Hz.`;
  }

  return createPortal(
    <div className="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="fps-settings-title">
      <div ref={boxRef} tabIndex={-1} className="modal-box max-w-sm rounded-md border border-base-content/10 bg-base-100 p-0 shadow-lift outline-none">
        <div className="flex items-start justify-between gap-4 p-6 pb-2">
          <div>
            <p className="eyebrow">Settings</p>
            <h3 id="fps-settings-title" className="mt-1 text-xl font-bold">Graphics defaults</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-base-content/60">
              Every FPS estimate uses these. Changes you make on a result are saved here too.
            </p>
          </div>
          <button className="btn btn-sm btn-square btn-ghost -mr-2 -mt-1" onClick={onClose} aria-label="Close">
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 pt-4">
          <FpsSettingsBar settings={settings} layout="list" />
          {displayHint && <p className="mt-2 text-right text-xs text-base-content/50">{displayHint}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-base-content/[0.08] px-6 py-4">
          <button className="btn btn-ghost btn-sm" onClick={reset}>Reset</button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </div>,
    document.body,
  );
}
