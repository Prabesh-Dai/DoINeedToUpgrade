"use client";

import { Fragment } from "react";
import { LuCheck } from "react-icons/lu";

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReached: number;
  steps?: string[];
}

const defaultSteps = ["Pick a Game", "Your System", "Results"];

export default function WizardStepper({ currentStep, onStepClick, maxReached, steps = defaultSteps }: Props) {
  return (
    <nav aria-label="Progress" className="mx-auto w-full max-w-lg">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const completed = stepNum < currentStep;
          const active = stepNum === currentStep;
          const clickable = stepNum <= maxReached && stepNum !== currentStep;

          return (
            <Fragment key={label}>
              {i > 0 && (
                <li aria-hidden="true" className="mx-2 h-px flex-1 bg-base-content/10 relative overflow-hidden">
                  <span
                    className={`absolute inset-0 bg-primary transition-transform duration-500 origin-left ${stepNum <= currentStep ? "scale-x-100" : "scale-x-0"}`}
                  />
                </li>
              )}
              <li>
                <button
                  className={`group flex items-center gap-2 rounded py-1 pl-1 pr-3 text-sm transition-colors ${
                    active
                      ? "text-base-content font-semibold"
                      : completed
                        ? "text-base-content/80"
                        : "text-base-content/40"
                  } ${clickable ? "cursor-pointer hover:bg-base-content/5" : "cursor-default"}`}
                  onClick={() => clickable && onStepClick(stepNum)}
                  disabled={!clickable}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded text-xs font-bold transition-colors ${
                      active
                        ? "bg-primary text-primary-content"
                        : completed
                          ? "bg-base-content/15 text-base-content"
                          : "bg-base-content/[0.06] text-base-content/50"
                    }`}
                  >
                    {completed ? <LuCheck className="h-3.5 w-3.5" strokeWidth={3} /> : stepNum}
                  </span>
                  <span className={`whitespace-nowrap ${active ? "" : "hidden sm:inline"}`}>{label}</span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
