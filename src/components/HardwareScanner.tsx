"use client";

import { useState, useEffect, useRef } from "react";
import { UserSpecs } from "@/types";
import { decodeSpecsPayload } from "@/lib/decodeSpecsPayload";
import { gameQuery, ScannerGame } from "@/lib/scannerGameParam";
import { LuCircleCheck, LuTriangleAlert, LuDownload, LuClipboardPaste, LuCopy, LuCheck, LuScanLine, LuTerminal } from "react-icons/lu";

interface Props {
  onImport: (specs: UserSpecs) => void;
  /** Game being checked; the script command carries it so the scan returns straight to results */
  game?: ScannerGame | null;
}

type ClientPlatform = "windows" | "macos" | "linux";

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

type StepGroup = {
  primary: React.ReactNode;
  alternatives?: {
    text: React.ReactNode;
    terminalCommand?: string;
  }[];
};

type PlatformInfo = {
  label: string;
  appFiles: { label: string; file: string }[];
  // {URL} is replaced with the script URL (quoted, since it may contain "?")
  terminalCommand: { label: string; path: string; command: string };
  stepGroups: StepGroup[];
};

const platformInfo: Record<ClientPlatform, PlatformInfo> = {
  windows: {
    label: "Windows",
    appFiles: [{ label: "Windows", file: "/downloads/DoINeedToUpgrade.exe" }],
    terminalCommand: { label: "PowerShell", path: "/api/scan.ps1", command: 'irm "{URL}" | iex' },
    stepGroups: [
      { primary: "Double-click the downloaded file to run." },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
  macos: {
    label: "macOS",
    appFiles: [
      { label: "Apple Silicon (M1 and newer)", file: "/downloads/DoINeedToUpgrade-Mac-AppleSilicon.dmg" },
      { label: "Intel Mac", file: "/downloads/DoINeedToUpgrade-Mac-Intel.dmg" },
    ],
    terminalCommand: { label: "Terminal", path: "/api/scan", command: 'curl -s "{URL}" | bash' },
    stepGroups: [
      { primary: "Open the .dmg and drag the app to Applications." },
      {
        primary: <>On first launch, go to <strong>System Settings → Privacy &amp; Security</strong> and click <strong>&quot;Open Anyway&quot;</strong>.</>,
        alternatives: [{
          text: "Remove the quarantine and open via Terminal:",
          terminalCommand: "xattr -d com.apple.quarantine /Applications/DoINeedToUpgrade*.app && open /Applications/DoINeedToUpgrade*.app",
        }],
      },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
  linux: {
    label: "Linux",
    appFiles: [
      { label: ".deb (Ubuntu/Debian)", file: "/downloads/DoINeedToUpgrade-Linux.deb" },
      { label: ".AppImage (Other)", file: "/downloads/DoINeedToUpgrade-Linux.AppImage" },
    ],
    terminalCommand: { label: "Terminal", path: "/api/scan", command: 'curl -s "{URL}" | bash' },
    stepGroups: [
      {
        primary: "For .deb: right-click → Open With → Software Install, then click Install.",
        alternatives: [{
          text: "For AppImage: right-click → Properties → mark as executable, then double-click.",
        }],
      },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
};

export default function HardwareScanner({ onImport, game }: Props) {
  const collapseRef = useRef<HTMLInputElement>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

  function closeCollapse() {
    if (collapseRef.current) collapseRef.current.checked = false;
  }

  function handleImport() {
    const result = decodeSpecsPayload(pasteValue);
    if (result) {
      setStatus("success");
      onImport(result);
      closeCollapse();
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } else {
      setStatus("error");
    }
  }

  function handlePasteChange(value: string) {
    setPasteValue(value);
    if (status !== "idle") setStatus("idle");
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setPasteValue(text);
      const result = decodeSpecsPayload(text);
      if (result) {
        setStatus("success");
        onImport(result);
        closeCollapse();
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      } else if (text.trim()) {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const info = platformInfo[clientPlatform];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scriptUrl = `${origin}${info.terminalCommand.path}${game ? `?${gameQuery(game)}` : ""}`;
  const command = info.terminalCommand.command.replace("{URL}", scriptUrl);

  return (
    <>
      <div id="hardware-scanner" className="collapse collapse-arrow w-full max-w-full overflow-hidden rounded-md border border-base-content/[0.08] bg-base-100/70">
        <input type="checkbox" ref={collapseRef} aria-label="Show hardware scanner options" />
        <div className="collapse-title flex items-center gap-3 !pl-3.5 sm:!pl-4 !pr-12 !py-3.5 !min-h-0">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-primary text-primary-content">
            <LuScanLine className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Get exact specs with the scanner</h3>
            <p className="text-xs text-base-content/55">
              Takes a few seconds. Open source, runs on your machine.
            </p>
          </div>
        </div>
        <div className="collapse-content !px-3.5 sm:!px-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 pt-1">
            {/* Terminal command */}
            <div className="flex min-w-0 flex-col gap-3 rounded border border-base-content/[0.08] bg-base-content/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LuTerminal className="h-4 w-4 text-base-content/50" />
                Run in {info.terminalCommand.label}
                <span className="chip ml-auto bg-primary text-primary-content">Fastest</span>
              </div>
              <div className="flex w-full max-w-full items-stretch overflow-hidden rounded-sm bg-base-300/70">
                <div className="min-w-0 flex-1 overflow-x-auto py-2.5 pl-3 pr-3 scrollbar-subtle">
                  <code className="whitespace-nowrap font-mono text-xs">{command}</code>
                </div>
                <button
                  className="btn btn-sm btn-square btn-ghost h-auto shrink-0 rounded-none border-l border-base-content/10"
                  onClick={async () => {
                    await navigator.clipboard.writeText(command);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  aria-label="Copy command"
                >
                  {copied ? <LuCheck className="h-4 w-4 text-success" /> : <LuCopy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-base-content/55 leading-relaxed">
                Detects your hardware and reopens this page with your specs filled in.
              </p>
            </div>

            {/* App download */}
            <div className="flex min-w-0 flex-col gap-3 rounded border border-base-content/[0.08] bg-base-content/[0.02] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LuDownload className="h-4 w-4 text-base-content/50" />
                Or download the app for {info.label}
              </div>
              <div className="flex flex-col gap-2">
                {info.appFiles.map((app) => (
                  <a
                    key={app.file}
                    href={app.file}
                    className="btn btn-sm btn-outline h-auto min-h-9 w-full justify-start py-2 text-left leading-snug"
                  >
                    <LuDownload className="h-4 w-4 shrink-0" />
                    {info.appFiles.length > 1 ? app.label : "Download scanner"}
                  </a>
                ))}
              </div>

              <ol className="flex flex-col gap-2.5">
                {info.stepGroups.map((group, groupIdx) => (
                  <li key={groupIdx} className="flex items-start gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-base-content/[0.08] text-[11px] font-semibold text-base-content/70">{groupIdx + 1}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 text-xs leading-relaxed text-base-content/75">
                      <span className="break-words">{group.primary}</span>
                      {group.alternatives?.map((alt, altIdx) => (
                        <div key={altIdx} className="flex flex-col gap-1.5 border-l-2 border-base-content/10 pl-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-base-content/40">Alternatively</span>
                          <span className="break-words">{alt.text}</span>
                          {alt.terminalCommand && (
                            <div className="flex w-full max-w-full items-stretch overflow-hidden rounded-sm bg-base-300/70">
                              <div className="min-w-0 flex-1 overflow-x-auto py-2 pl-3 pr-3 scrollbar-subtle">
                                <code className="whitespace-nowrap font-mono text-[11px]">{alt.terminalCommand}</code>
                              </div>
                              <button
                                className="btn btn-sm btn-square btn-ghost h-auto shrink-0 rounded-none border-l border-base-content/10"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(alt.terminalCommand!);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                aria-label="Copy command"
                              >
                                {copied ? <LuCheck className="h-3.5 w-3.5 text-success" /> : <LuCopy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Paste fallback */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-base-content/55">Already have a code from the scanner? Paste it here.</p>
            <div className="flex gap-2">
              <input
                type="text"
                className={`input input-bordered input-sm flex-1 min-w-0 font-mono text-xs ${status === "error" ? "input-error" : status === "success" ? "input-success" : ""}`}
                placeholder="DINAU:..."
                value={pasteValue}
                onChange={(e) => handlePasteChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImport();
                  }
                }}
                aria-label="Scanner code"
              />
              <button
                className="btn btn-sm btn-ghost border border-base-content/10 gap-1.5"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
              >
                <LuClipboardPaste className="h-4 w-4" />
                <span className="hidden sm:inline">Paste</span>
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleImport}
                disabled={!pasteValue.trim()}
              >
                Import
              </button>
            </div>
            {status === "success" && (
              <p className="flex items-center gap-1.5 text-xs text-success">
                <LuCircleCheck className="h-4 w-4" />
                Specs imported.
              </p>
            )}
            {status === "error" && (
              <p className="flex items-center gap-1.5 text-xs text-error">
                <LuTriangleAlert className="h-4 w-4" />
                That code isn&apos;t valid. Make sure you copied the whole DINAU:... string.
              </p>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-3 sm:right-5 z-50 animate-toast-in max-w-[calc(100vw-1.5rem)]" role="status">
          <div className="toast-card">
            <LuCircleCheck className="h-5 w-5 shrink-0 text-success" />
            <span>Hardware specs imported</span>
          </div>
        </div>
      )}
    </>
  );
}
