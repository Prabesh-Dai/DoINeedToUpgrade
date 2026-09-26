"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LuDownload, LuInfo, LuX, LuGamepad2, LuCpu, LuGauge, LuShieldCheck, LuGithub, LuArrowUpRight } from "react-icons/lu";

type ClientPlatform = "windows" | "macos" | "linux";

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

const downloadLinks = {
  windows: [{ label: "Windows", hint: "Windows 10 and 11", file: "/downloads/DoINeedToUpgrade.exe" }],
  macos: [
    { label: "Mac (Apple Silicon)", hint: "M1 and newer", file: "/downloads/DoINeedToUpgrade-Mac-AppleSilicon.zip" },
    { label: "Mac (Intel)", hint: "Older Macs", file: "/downloads/DoINeedToUpgrade-Mac-Intel.zip" },
  ],
  linux: [{ label: "Linux", hint: "AppImage", file: "/downloads/DoINeedToUpgrade-Linux.AppImage" }],
};

const howItWorks = [
  {
    icon: LuGamepad2,
    title: "Pick a game",
    body: "Search for any game on Steam, or switch to all games. We grab the official minimum and recommended specs for Windows, macOS and Linux.",
  },
  {
    icon: LuCpu,
    title: "Confirm your specs",
    body: "We fill in what we can from your browser. For exact numbers, run the scanner. It reads your CPU, GPU, RAM and free storage.",
  },
  {
    icon: LuGauge,
    title: "Get your verdict",
    body: "We score each part with benchmark data and compare it to the requirements. You'll see if it runs, what to upgrade, and roughly what FPS to expect.",
  },
];

export default function NavButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const primaryLinks = downloadLinks[clientPlatform];
  const otherLinks = (Object.keys(downloadLinks) as ClientPlatform[])
    .filter((p) => p !== clientPlatform)
    .flatMap((p) => downloadLinks[p]);

  return (
    <>
      <button
        className="btn btn-ghost btn-sm h-9 min-h-0 gap-2 px-2.5 text-base-content/70 hover:text-base-content"
        onClick={() => setModalOpen(true)}
        aria-label="How it works"
      >
        <LuInfo className="h-4 w-4" />
        <span className="hidden md:inline">How it works</span>
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          className="btn btn-ghost btn-sm h-9 min-h-0 gap-2 px-2.5 text-base-content/70 hover:text-base-content"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-label="Download scanner"
        >
          <LuDownload className="h-4 w-4" />
          <span className="hidden md:inline">Get scanner</span>
        </button>
        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-base-content/10 bg-base-100 p-2 shadow-lift animate-dropdownIn"
          >
            {primaryLinks.map((link) => (
              <a
                key={link.file}
                href={link.file}
                download
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="mb-1 flex items-center gap-3 rounded bg-primary px-3 py-2.5 text-primary-content transition-opacity hover:opacity-90"
              >
                <LuDownload className="h-4 w-4 shrink-0" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold leading-tight">{link.label}</span>
                  <span className="text-xs opacity-60">{link.hint}</span>
                </span>
              </a>
            ))}
            <p className="eyebrow px-2.5 pb-1 pt-2">Other platforms</p>
            {otherLinks.map((link) => (
              <a
                key={link.file}
                href={link.file}
                download
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-between gap-3 rounded px-2.5 py-2 text-sm hover:bg-base-content/5 transition-colors"
              >
                <span className="whitespace-nowrap">{link.label}</span>
                <span className="whitespace-nowrap text-xs text-base-content/40">{link.hint}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {modalOpen && createPortal(
        <div className="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
          <div className="modal-box max-w-xl rounded-md border border-base-content/10 bg-base-100 p-0 shadow-lift">
            <div className="flex items-start justify-between gap-4 p-6 pb-2">
              <div>
                <p className="eyebrow">How it works</p>
                <h3 id="how-it-works-title" className="mt-1 text-2xl font-bold">Three steps to a verdict</h3>
              </div>
              <button
                className="btn btn-sm btn-square btn-ghost -mr-2 -mt-1"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            <ol className="flex flex-col gap-3 p-6 pt-4">
              {howItWorks.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-4 rounded-md surface-muted p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-primary text-primary-content">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-semibold">
                      <span className="text-base-content/40 mr-1.5 tabular-nums">{i + 1}.</span>{title}
                    </h4>
                    <p className="mt-1 text-sm text-base-content/70 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mx-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-base-content/10 bg-base-content/[0.03] p-4">
              <LuShieldCheck className="h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm text-base-content/70 leading-relaxed">
                The scanner is open source and runs on your computer. It doesn't upload anything. It just opens this page with your specs filled in.
              </p>
              <a
                href="https://github.com/bababubudev/DoINeedToUpgrade/tree/main/scanner"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <LuGithub className="h-4 w-4" /> Source <LuArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
        </div>,
        document.body
      )}
    </>
  );
}
