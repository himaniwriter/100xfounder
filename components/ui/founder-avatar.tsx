"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type FounderAvatarProps = {
  name: string;
  imageUrl?: string | null;
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

function gradientFromName(name: string) {
  const palette = [
    ["#3b82f6", "#6366f1", "#0f172a"],
    ["#22d3ee", "#3b82f6", "#111827"],
    ["#8b5cf6", "#6366f1", "#0f172a"],
    ["#0ea5e9", "#7c3aed", "#111827"],
  ];
  const [first, second, third] = palette[hashValue(name) % palette.length];
  return {
    backgroundImage: `radial-gradient(circle at 24% 22%, ${first}, transparent 48%), radial-gradient(circle at 78% 26%, ${second}, transparent 50%), linear-gradient(145deg, ${third}, #050505 76%)`,
  };
}

export function FounderAvatar({
  name,
  imageUrl,
  className,
  imageClassName,
}: FounderAvatarProps) {
  const sources = useMemo(() => {
    if (!imageUrl || !imageUrl.trim()) {
      return [] as string[];
    }
    return [imageUrl.trim()];
  }, [imageUrl]);

  const [attemptIndex, setAttemptIndex] = useState(0);

  useEffect(() => {
    setAttemptIndex(0);
  }, [name, imageUrl]);

  const activeSource = sources[attemptIndex];

  if (activeSource) {
    return (
      <div className={cn("overflow-hidden bg-black/35", className)}>
        <img
          src={activeSource}
          alt={name}
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setAttemptIndex((current) => Math.min(current + 1, sources.length))}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("grid h-full w-full place-items-center overflow-hidden bg-black/35", className)}
      style={gradientFromName(name)}
      aria-label={`${name} avatar fallback`}
    >
      <svg
        viewBox="0 0 48 48"
        className="h-6 w-6 text-white/75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="24" cy="17" r="8" fill="currentColor" />
        <path d="M9 39c1.8-7.2 7.7-11 15-11s13.2 3.8 15 11" fill="currentColor" />
      </svg>
    </div>
  );
}
