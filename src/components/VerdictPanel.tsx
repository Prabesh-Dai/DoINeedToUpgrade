import { VerdictResult, OverallVerdict } from "@/types";
import { LuCheck, LuX, LuTriangleAlert, LuCircleHelp, LuArrowRight } from "react-icons/lu";

interface Props {
  result: VerdictResult;
}

const tones: Record<OverallVerdict, { label: string; stripe: string; solid: string; icon: typeof LuCheck }> = {
  pass: { label: "Ready to play", stripe: "bg-success", solid: "bg-success text-success-content", icon: LuCheck },
  minimum: { label: "Playable", stripe: "bg-warning", solid: "bg-warning text-warning-content", icon: LuTriangleAlert },
  fail: { label: "Upgrade needed", stripe: "bg-error", solid: "bg-error text-error-content", icon: LuX },
  unknown: { label: "Take a closer look", stripe: "bg-base-content", solid: "bg-base-content text-base-100", icon: LuCircleHelp },
};

export default function VerdictPanel({ result }: Props) {
  const tone = tones[result.verdict];
  const Icon = tone.icon;
  const isFail = result.verdict === "fail";
  const showUpgrades = result.upgradeItems.length > 0 && result.verdict !== "pass";

  return (
    <section className="card overflow-hidden" aria-live="polite">
      <div className={`h-1 ${tone.stripe}`} />
      <div className="p-5 sm:p-7">
        <div className="flex items-center gap-4">
          <span className={`grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded ${tone.solid}`}>
            <Icon className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{tone.label}</p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold leading-tight tracking-tight">{result.title}</h2>
          </div>
        </div>

        {showUpgrades && (
          <div className="mt-6">
            <p className="eyebrow mb-2.5">{isFail ? "What to upgrade" : "Upgrade for the best experience"}</p>
            <ul className="divide-y divide-base-content/[0.08] overflow-hidden rounded border border-base-content/10">
              {result.upgradeItems.map((item) => (
                <li
                  key={item.component}
                  className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4"
                >
                  <span className="font-semibold">{item.component}</span>
                  <span className="text-base-content/55 break-words">
                    <span className="sm:hidden text-base-content/40">You have: </span>{item.current}
                  </span>
                  <LuArrowRight className="hidden sm:block h-4 w-4 text-base-content/30" />
                  <span className="font-medium break-words">
                    <span className="sm:hidden font-normal text-base-content/40">{isFail ? "Needs: " : "Recommended: "}</span>{item.required}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
