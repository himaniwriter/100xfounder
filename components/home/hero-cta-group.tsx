"use client";

import Link from "next/link";
import { trackSiteEvent } from "@/lib/client-tracking";

type HeroCtaGroupProps = {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export function HeroCtaGroup({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: HeroCtaGroupProps) {
  function onCtaClick(label: string, target: string) {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    trackSiteEvent({
      event_name: "cta_click",
      path,
      payload: {
        cta_label: label,
        cta_target: target,
        section: "home_hero",
      },
    });
  }

  return (
    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
      <Link
        href={primaryHref}
        onClick={() => onCtaClick(primaryLabel, primaryHref)}
        className="glass-cta-btn w-full justify-center sm:w-auto sm:min-w-[220px]"
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        onClick={() => onCtaClick(secondaryLabel, secondaryHref)}
        className="glass-ghost-btn w-full justify-center sm:w-auto sm:min-w-[220px]"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
