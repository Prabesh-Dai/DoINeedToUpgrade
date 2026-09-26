"use client";

import { LuArrowLeft, LuArrowRight } from "react-icons/lu";

interface ActionBarProps {
  onBack?: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: string;
  hint?: React.ReactNode;
}

// Sticks to the bottom of the scroll area so the primary action is always reachable
export default function ActionBar({ onBack, backLabel = "Back", onNext, nextLabel, hint }: ActionBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-2 border-t border-base-content/[0.08] bg-base-200/90 px-4 py-3 backdrop-blur-md sm:bottom-4 sm:mx-0 sm:rounded-md sm:border sm:bg-base-100/90 sm:px-4 sm:shadow-lift">
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <button className="btn btn-ghost gap-2" onClick={onBack}>
            <LuArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        ) : <span />}
        <div className="flex items-center gap-4">
          {hint && <span className="hidden md:flex items-center gap-1.5 text-xs text-base-content/40">{hint}</span>}
          <button className="btn btn-primary gap-2 px-6" onClick={onNext}>
            {nextLabel}
            <LuArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
