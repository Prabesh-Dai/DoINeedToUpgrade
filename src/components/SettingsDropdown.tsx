"use client";

import { useEffect, useRef, useState } from "react";
import { LuSettings, LuSun, LuMoon, LuSparkles } from "react-icons/lu";

export default function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No saved choice: follow the system theme (and keep following it if it changes)
    const savedTheme = localStorage.getItem("theme");
    const systemLight = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = (isDark: boolean) => {
      setDark(isDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    };
    applyTheme(savedTheme ? savedTheme !== "light" : !systemLight.matches);
    const onSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) applyTheme(!e.matches);
    };
    systemLight.addEventListener("change", onSystemChange);

    const savedMotion = localStorage.getItem("reduceMotion");
    const isReduced = savedMotion !== null
      ? savedMotion === "true"
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);
    document.documentElement.setAttribute("data-reduce-motion", String(isReduced));

    return () => systemLight.removeEventListener("change", onSystemChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  function toggleMotion() {
    const next = !reduced;
    setReduced(next);
    document.documentElement.setAttribute("data-reduce-motion", String(next));
    localStorage.setItem("reduceMotion", String(next));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn btn-ghost btn-sm btn-square h-9 w-9 min-h-0 text-base-content/70 hover:text-base-content"
        onClick={() => setOpen(!open)}
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <LuSettings className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-base-content/10 bg-base-100 p-2 shadow-lift animate-dropdownIn"
        >
          <p className="eyebrow px-2.5 pb-1 pt-1.5">Preferences</p>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm hover:bg-base-content/5">
            <span className="flex items-center gap-2.5">
              {dark ? <LuMoon className="h-4 w-4 text-base-content/60" /> : <LuSun className="h-4 w-4 text-base-content/60" />}
              Dark mode
            </span>
            <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={dark} onChange={toggleTheme} />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm hover:bg-base-content/5">
            <span className="flex items-center gap-2.5">
              <LuSparkles className="h-4 w-4 text-base-content/60" />
              Animations
            </span>
            <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={!reduced} onChange={toggleMotion} />
          </label>
        </div>
      )}
    </div>
  );
}
