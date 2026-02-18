"use client";

import { useEffect, useMemo, useState } from "react";
import { buildLinkedInAvatarSources } from "@/lib/founders/linkedin";
import { cn } from "@/lib/utils";

type FounderAvatarProps = {
  name: string;
  imageUrl?: string | null;
  linkedinUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function buildSeededAvatarSources(name: string): string[] {
  const seed = encodeURIComponent(name.trim().toLowerCase() || "founder");
  return [
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}`,
    `https://api.dicebear.com/9.x/micah/svg?seed=${seed}`,
  ];
}

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
  linkedinUrl,
  className,
  imageClassName,
}: FounderAvatarProps) {
  const sources = useMemo(() => {
    const values: string[] = [];
    if (imageUrl && imageUrl.trim()) {
      values.push(imageUrl.trim());
    }

    values.push(
      ...buildLinkedInAvatarSources({
        linkedinUrl,
        founderName: name,
      }),
    );

    values.push(...buildSeededAvatarSources(name));

    return Array.from(new Set(values));
  }, [imageUrl, linkedinUrl, name]);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAttemptIndex(0);
    setIsLoaded(false);
  }, [name, imageUrl, linkedinUrl]);

  const activeSource = sources[attemptIndex];

  return (
    <div
      className={cn("relative grid h-full w-full place-items-center overflow-hidden bg-black/35", className)}
      style={gradientFromName(name)}
      aria-label={`${name} avatar fallback`}
    >
      {activeSource ? (
        <img
          src={activeSource}
          alt={name}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setIsLoaded(false);
            setAttemptIndex((current) => {
              const next = current + 1;
              return next < sources.length ? next : sources.length;
            });
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 48 48"
        className={cn("h-6 w-6 text-white/75 transition-opacity", isLoaded ? "opacity-0" : "opacity-100")}
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
