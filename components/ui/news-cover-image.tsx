"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type NewsCoverImageProps = {
  title: string;
  imageUrl?: string | null;
  uniqueId: string;
  className?: string;
  imageClassName?: string;
};

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fallbackGradient(seed: string) {
  const palette = [
    ["#1d4ed8", "#6366f1", "#111827"],
    ["#7c3aed", "#2563eb", "#111827"],
    ["#0ea5e9", "#3b82f6", "#0f172a"],
  ];
  const [first, second, third] = palette[hashValue(seed) % palette.length];

  return {
    backgroundImage: `radial-gradient(circle at 20% 20%, ${first}, transparent 52%), radial-gradient(circle at 78% 30%, ${second}, transparent 54%), linear-gradient(150deg, ${third}, #020617 82%)`,
  };
}

function topicFallbackImage(title: string): string {
  const value = title.toLowerCase();
  if (/fund|round|deal|capital|valuation|investor|finance/.test(value)) {
    return "/images/covers/funding-wire.svg";
  }
  if (/ai|genai|machine|model|yc/.test(value)) {
    return "/images/covers/ai-grid.svg";
  }
  if (/hiring|talent|team|culture|people/.test(value)) {
    return "/images/covers/talent-map.svg";
  }
  return "/images/covers/startup-brief.svg";
}

export function NewsCoverImage({
  title,
  imageUrl,
  uniqueId,
  className,
  imageClassName,
}: NewsCoverImageProps) {
  const localFallback = useMemo(() => topicFallbackImage(title), [title]);
  const sources = useMemo(() => {
    const values: string[] = [];

    if (imageUrl && imageUrl.trim()) {
      values.push(imageUrl.trim());
    }

    values.push(localFallback);

    return values;
  }, [imageUrl, localFallback]);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const activeSource = sources[attemptIndex];

  if (activeSource) {
    return (
      <div className={cn("overflow-hidden bg-black/35", className)}>
        <img
          src={activeSource}
          alt={title}
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() =>
            setAttemptIndex((current) => Math.min(current + 1, sources.length))
          }
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid h-full w-full place-items-center overflow-hidden bg-black/35 text-zinc-300",
        className,
      )}
      style={fallbackGradient(uniqueId)}
      aria-label={`${title} fallback cover`}
    >
      <div className="inline-flex rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200">
        Startup Intelligence
      </div>
    </div>
  );
}
