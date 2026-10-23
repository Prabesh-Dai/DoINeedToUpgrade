"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuInfo } from "react-icons/lu";

interface Props {
  children: React.ReactNode;
  label?: string;
}

// Space between the button and the note, and the minimum gap to the viewport edge
const GAP = 6;
const EDGE = 8;

// Small "i" button that shows a floating note on hover, focus or tap.
// Lines up with the button's right edge so it opens leftward; place it at the end of a row.
// The note renders in a portal so cards with overflow-hidden can't clip it.
export default function InfoTip({ children, label = "More info" }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !tipRef.current?.contains(target)) {
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

  // Place the note under the button, or above it when there's no room below
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    function place() {
      if (!ref.current || !tipRef.current) return;
      const btn = ref.current.getBoundingClientRect();
      // offset sizes ignore the scale from the open animation
      const { offsetWidth: width, offsetHeight: height } = tipRef.current;
      const viewW = document.documentElement.clientWidth;
      const viewH = document.documentElement.clientHeight;
      const below = btn.bottom + GAP;
      const above = btn.top - GAP - height;
      const top = below + height > viewH - EDGE && above >= EDGE ? above : below;
      const left = Math.min(Math.max(btn.right - width, EDGE), viewW - width - EDGE);
      setPos({ top, left });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
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
      {open && createPortal(
        <span
          ref={tipRef}
          id={id}
          role="tooltip"
          className="fixed z-50 w-60 rounded border border-base-content/10 bg-base-100 px-3 py-2.5 text-left text-xs normal-case leading-relaxed tracking-normal text-base-content/80 shadow-lift animate-dropdownIn"
          style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: "hidden" }}
        >
          {children}
        </span>,
        document.body,
      )}
    </span>
  );
}
