"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  companyName: string;
  websiteUrl?: string | null;
  domain?: string | null;
  className?: string;
  imageClassName?: string;
};

function parseDomain(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    const sanitized = value.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    return sanitized || null;
  }
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
    ["#3b82f6", "#6366f1", "#1e293b"],
    ["#06b6d4", "#2563eb", "#0f172a"],
    ["#8b5cf6", "#3b82f6", "#111827"],
    ["#6366f1", "#a855f7", "#111827"],
  ];
  const [first, second, third] = palette[hashValue(name) % palette.length];

  return {
    backgroundImage: `radial-gradient(circle at 24% 20%, ${first}, transparent 50%), radial-gradient(circle at 78% 24%, ${second}, transparent 50%), linear-gradient(150deg, ${third}, #020617 82%)`,
  };
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

const CURATED_LOGO_MAP: Record<string, string> = {
  zepto: "/images/logos/zepto.svg",
  "sarvam-ai": "/images/logos/sarvam-ai.svg",
  juspay: "/images/logos/juspay.svg",
  perfios: "/images/logos/perfios.svg",
  "appsforbharat": "/images/logos/appsforbharat.svg",
  bluestone: "/images/logos/bluestone.svg",
  razorpay: "/images/logos/razorpay.svg",
  lentra: "/images/logos/lentra.svg",
  rebelfoods: "/images/logos/rebel-foods.svg",
  udaan: "/images/logos/udaan.svg",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function CompanyLogo({
  companyName,
  websiteUrl,
  domain,
  className,
  imageClassName,
}: CompanyLogoProps) {
  const resolvedDomain = useMemo(
    () => parseDomain(domain) ?? parseDomain(websiteUrl),
    [domain, websiteUrl],
  );
  const sources = useMemo(() => {
    const values: string[] = [];
    const companySlug = slugify(companyName);
    const curated = CURATED_LOGO_MAP[companySlug];
    if (curated) {
      values.push(curated);
    }
    if (resolvedDomain) {
      values.push(
        `https://logo.clearbit.com/${resolvedDomain}`,
        `https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`,
      );
    }
    return values;
  }, [companyName, resolvedDomain]);

  const [attemptIndex, setAttemptIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAttemptIndex(0);
    setIsLoaded(false);
  }, [companyName, resolvedDomain]);

  const activeSource = sources[attemptIndex];

  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden bg-black/30 text-xs font-semibold text-white",
        className,
      )}
      style={gradientFromName(companyName)}
      aria-label={`${companyName} initials avatar`}
    >
      {activeSource ? (
        <img
          src={activeSource}
          alt={`${companyName} logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
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
      <span className={cn("text-sm tracking-wide transition-opacity", isLoaded ? "opacity-0" : "opacity-100")}>
        {initialsFromName(companyName)}
      </span>
    </div>
  );
}
