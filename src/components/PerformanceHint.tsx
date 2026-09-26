"use client";

import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";

export default function PerformanceHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onHint() {
      if (sessionStorage.getItem("perfHintDismissed")) return;
      setVisible(true);
    }
    window.addEventListener("performancehint", onHint);
    return () => window.removeEventListener("performancehint", onHint);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("perfHintDismissed", "true");
  }

  return (
    <div className="fixed right-3 sm:right-5 top-16 sm:top-20 z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-sm animate-toast-in" role="status">
      <div className="toast-card border-l-[3px] border-l-warning items-start sm:items-center">
        <span className="flex-1 min-w-0 break-words">
          Animations might be slowing things down. You can turn them off in <strong>Settings</strong>.
        </span>
        <button className="btn btn-ghost btn-xs btn-square shrink-0" onClick={dismiss} aria-label="Dismiss">
          <LuX className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
