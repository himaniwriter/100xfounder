"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { logDataUnlock } from "@/lib/client-tracking";

type GatedValueProps = {
  blurredPreview: string;
  actualValue: string | null;
  ctaLabel?: string;
  companyId: string;
};

export function GatedValue({
  blurredPreview,
  actualValue,
  ctaLabel = "Show Info",
  companyId,
}: GatedValueProps) {
  const [revealed, setRevealed] = useState(false);
  const displayValue = useMemo(() => actualValue ?? blurredPreview, [actualValue, blurredPreview]);
  const visibleValue = revealed ? displayValue : blurredPreview;

  async function onReveal() {
    // TODO: Check User Subscription Tier Here
    setRevealed(true);
    await logDataUnlock(companyId);
  }

  return (
    <div className="relative inline-flex min-h-9 min-w-[175px] items-center rounded-md border border-white/10 bg-black/25 px-2.5 py-1.5">
      <span
        className={`pr-24 text-sm text-zinc-100 transition-[filter,opacity] duration-200 ${
          revealed ? "blur-0 opacity-100" : "select-none blur-sm opacity-90"
        }`}
      >
        {visibleValue}
      </span>
      {!revealed ? (
        <button
          type="button"
          onClick={onReveal}
          className="absolute inset-y-1 right-1 inline-flex items-center gap-1 rounded bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 text-[10px] font-medium text-white transition-all hover:brightness-110"
        >
          <Lock className="h-3 w-3" />
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
