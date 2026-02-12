"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type GatedValueProps = {
  value?: string | null;
  fallback?: string;
  className?: string;
  blurredPreview?: string;
  actualValue?: string | null;
};

export function GatedValue({
  value,
  fallback = "N/A",
  className,
  blurredPreview,
  actualValue,
}: GatedValueProps) {
  const displayValue = useMemo(
    () => value ?? actualValue ?? blurredPreview ?? fallback,
    [value, actualValue, blurredPreview, fallback],
  );

  return (
    <div
      className={cn(
        "inline-flex min-h-9 min-w-[175px] items-center rounded-md border border-white/10 bg-black/25 px-2.5 py-1.5",
        className,
      )}
    >
      <span className="text-sm text-zinc-100">
        {displayValue}
      </span>
    </div>
  );
}
