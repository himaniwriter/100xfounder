"use client";

import { Search } from "lucide-react";

export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      aria-label="Open command palette"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 text-zinc-300 transition-colors hover:border-white/20 hover:text-white sm:w-auto sm:px-2.5"
    >
      <Search className="h-4 w-4" />
      <span className="hidden text-[11px] text-zinc-400 lg:inline">search founder, news etc</span>
    </button>
  );
}
