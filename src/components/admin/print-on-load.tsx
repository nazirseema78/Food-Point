"use client";

import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print mb-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
    >
      Print
    </button>
  );
}
