"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuInfo } from "react-icons/lu";

interface Props {
  children: React.ReactNode;
  label?: string;
}

// Gap between the button and the note, and the closest the note gets to the screen edge
const GAP = 6;
const EDGE = 8;

// Small "i" button that shows a floating note on hover, focus or tap.
// Anchored to the right so it opens leftward; place it at the end of a row.
// The note is rendered into <body> with fixed positioning so a card with
// overflow-hidden can't clip it. It opens upward when there's no room below.
export default function InfoTip({ children, label = "More info" }: Props) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
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

  // Layout effect so the note is placed before it's painted
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    function place() {
      if (!ref.current || !tipRef.current) return;
      const button = ref.current.getBoundingClientRect();
      const tip = tipRef.current.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const below = button.bottom + GAP;
      const fitsBelow = below + tip.height <= window.innerHeight - EDGE;
      const fitsAbove = button.top - GAP - tip.height >= EDGE;
      setPos({
        top: !fitsBelow && fitsAbove ? button.top - GAP - tip.height : below,
        // Keep the left edge on screen when the button sits near the left
        right: Math.min(viewportWidth - button.right, viewportWidth - tip.width - EDGE),
      });
    }
    place();
    // Capture catches scrolling in any container, not just the window
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
          // Hidden for the moment before it's measured and placed
          style={pos ? { top: pos.top, right: pos.right } : { top: 0, right: 0, visibility: "hidden" }}
        >
          {children}
        </span>,
        document.body,
      )}
    </span>
  );
}
