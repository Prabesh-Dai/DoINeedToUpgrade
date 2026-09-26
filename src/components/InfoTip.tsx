"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LuInfo } from "react-icons/lu";

interface Props {
  children: React.ReactNode;
  label?: string;
}

// Small "i" button that shows a floating note on hover, focus or tap.
// Anchored to the right so it opens leftward; place it at the end of a row.
export default function InfoTip({ children, label = "More info" }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPinned(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!pinned) setOpen(false); }}
    >
      <button
        type="button"
        className="grid h-6 w-6 place-items-center rounded-sm text-base-content/45 transition-colors hover:bg-base-content/[0.06] hover:text-base-content"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => {
          const next = !pinned;
          setPinned(next);
          setOpen(next);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => { if (!pinned) setOpen(false); }}
      >
        <LuInfo className="h-4 w-4" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-1.5 w-60 rounded border border-base-content/10 bg-base-100 px-3 py-2.5 text-left text-xs normal-case leading-relaxed tracking-normal text-base-content/80 shadow-lift animate-dropdownIn"
        >
          {children}
        </span>
      )}
    </span>
  );
}
