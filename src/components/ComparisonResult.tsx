import { ComparisonItem, ComparisonStatus } from "@/types";
import { NOT_LISTED } from "@/lib/compareSpecs";
import { LuCheck, LuX, LuCpu, LuMonitor, LuMemoryStick, LuHardDrive, LuLaptop, LuBox } from "react-icons/lu";

interface Props {
  items: ComparisonItem[];
}

const componentIcons: Record<string, typeof LuCpu> = {
  "Operating System": LuLaptop,
  Processor: LuCpu,
  Graphics: LuMonitor,
  "Memory (RAM)": LuMemoryStick,
  Storage: LuHardDrive,
};

const statusLabels: Record<ComparisonStatus, string> = {
  pass: "Meets",
  fail: "Below",
  warn: "Check manually",
  info: "Check manually",
};

function StatusMark({ status }: { status: ComparisonStatus }) {
  const base = "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-sm";
  if (status === "pass") return <span className={`${base} bg-success text-success-content`}><LuCheck className="h-3 w-3" strokeWidth={3.5} /></span>;
  if (status === "fail") return <span className={`${base} bg-error text-error-content`}><LuX className="h-3 w-3" strokeWidth={3.5} /></span>;
  return <span className={`${base} bg-warning text-warning-content text-[11px] font-black leading-none`}>?</span>;
}

function RequirementCell({ value, status }: { value: string; status: ComparisonStatus }) {
  if (value === NOT_LISTED) {
    return <span className="text-base-content/35">{value}</span>;
  }
  return (
    <div className="flex items-start gap-2.5" title={`${statusLabels[status]}: ${value}`}>
      <span className="mt-px"><StatusMark status={status} /></span>
      <span className={`min-w-0 break-words ${status === "fail" ? "font-semibold" : ""}`}>
        <span className="sr-only">{statusLabels[status]}: </span>
        {value}
      </span>
    </div>
  );
}

export default function ComparisonResult({ items }: Props) {
  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-base-content/[0.08] px-5 py-4">
        <h2 className="font-semibold">Component breakdown</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-base-content/60">
          <span className="flex items-center gap-1.5"><StatusMark status="pass" /> Meets</span>
          <span className="flex items-center gap-1.5"><StatusMark status="warn" /> Check manually</span>
          <span className="flex items-center gap-1.5"><StatusMark status="fail" /> Below</span>
        </div>
      </header>

      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-base-content/[0.08] sm:hidden">
        {items.map((item) => {
          const Icon = componentIcons[item.label] ?? LuBox;
          return (
            <li key={item.label} className="flex flex-col gap-3 px-5 py-4 text-sm">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-base-content/40" />
                <div className="min-w-0">
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-0.5 break-words text-base-content/60">{item.userValue}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div>
                  <p className="eyebrow mb-1">Minimum</p>
                  <RequirementCell value={item.minValue} status={item.minStatus} />
                </div>
                <div>
                  <p className="eyebrow mb-1">Recommended</p>
                  <RequirementCell value={item.recValue} status={item.recStatus} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* sm and up: table */}
      <div className="hidden sm:block overflow-x-auto scrollbar-subtle">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-base-content/[0.08] text-left">
              <th className="eyebrow w-[22%] px-5 py-3 font-semibold">Component</th>
              <th className="eyebrow w-[26%] px-4 py-3 font-semibold">Your system</th>
              <th className="eyebrow w-[26%] px-4 py-3 font-semibold">Minimum</th>
              <th className="eyebrow w-[26%] px-5 py-3 font-semibold">Recommended</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-content/[0.06]">
            {items.map((item) => {
              const Icon = componentIcons[item.label] ?? LuBox;
              return (
                <tr key={item.label} className="align-top transition-colors hover:bg-base-content/[0.02]">
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2.5 font-semibold">
                      <Icon className="h-4 w-4 shrink-0 text-base-content/40" />
                      {item.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 break-words text-base-content/75">{item.userValue}</td>
                  <td className="px-4 py-4"><RequirementCell value={item.minValue} status={item.minStatus} /></td>
                  <td className="px-5 py-4"><RequirementCell value={item.recValue} status={item.recStatus} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
