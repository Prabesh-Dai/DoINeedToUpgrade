"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import FpsSettingsBar from "@/components/FpsSettingsBar";
import { FALLBACK_HZ, useFpsSettings } from "@/lib/useFpsSettings";

/**
 * Dialog for the resolution, quality and display rate every FPS estimate uses.
 * Changes apply as they're made, so "Done" just closes it (as do Escape and
 * clicking outside).
 */
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
  if (detectedHz === null) {
    if (displayHzIsAuto) displayHint = `Couldn't detect it, so we assume ${FALLBACK_HZ} Hz`;
  } else if (displayHz === detectedHz) {
    displayHint = "Matches this screen";
  } else {
    // One short link, so it fits on a line under the label
    displayHint = (
      <button type="button" className="underline underline-offset-2 transition-colors hover:text-base-content" onClick={() => setDisplayHz(null)}>
        Use detected {detectedHz} Hz
      </button>
    );
  }

  return createPortal(
    <div className="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="fps-settings-title">
      <div ref={boxRef} tabIndex={-1} className="modal-box max-w-sm rounded-md border border-base-content/10 bg-base-100 p-6 shadow-lift outline-none">
        <h3 id="fps-settings-title" className="text-xl font-bold">Graphics defaults</h3>
        <p className="mt-1 text-sm text-base-content/60">Used for every FPS estimate.</p>

        <FpsSettingsBar settings={settings} layout="list" displayHint={displayHint} className="mt-6" />

        <div className="mt-7 flex items-center justify-between gap-3">
          <button className="btn btn-ghost btn-sm -ml-3" onClick={reset}>Reset</button>
          <button className="btn btn-primary btn-sm px-5" onClick={onClose}>Done</button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </div>,
    document.body,
  );
}
