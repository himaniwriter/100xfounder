import {
  Bell,
  Coins,
  Flame,
  Linkedin,
  MapPin,
  Share2,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { FounderDirectoryItem } from "@/lib/founders/types";

type FounderCardProps = {
  founder: FounderDirectoryItem;
  isTrending?: boolean;
  featured?: boolean;
};

const GRADIENT_PALETTE = [
  ["#6366f1", "#8b5cf6", "#3b82f6"],
  ["#a855f7", "#6366f1", "#06b6d4"],
  ["#ec4899", "#8b5cf6", "#6366f1"],
  ["#22d3ee", "#6366f1", "#a855f7"],
  ["#f97316", "#eab308", "#8b5cf6"],
];

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function meshGradient(seed: string) {
  const [first, second, third] = GRADIENT_PALETTE[hashValue(seed) % GRADIENT_PALETTE.length];
  return {
    backgroundImage: `radial-gradient(circle at 22% 20%, ${first}, transparent 48%), radial-gradient(circle at 78% 28%, ${second}, transparent 50%), linear-gradient(145deg, ${third}, #0a0a0f 75%)`,
  };
}

function readDomain(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export function FounderCard({ founder, isTrending = false, featured = false }: FounderCardProps) {
  const domain = readDomain(founder.websiteUrl);
  const companyLogoUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;
  const profileUrl = `/founders/${founder.slug}`;
  const linkedInUrl =
    founder.linkedinUrl ??
    `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(founder.companyName)}`;
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
  const employeeCount = founder.employeeCount ?? "500+";
  const location = founder.headquarters ?? "India";

  return (
    <GlassCard
      className={cn(
        "border-white/10 bg-white/[0.03] p-5 backdrop-blur-[20px] transition-all hover:border-white/20 hover:bg-white/[0.045] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]",
        featured ? "md:p-6" : "",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-5",
          featured ? "md:flex-row md:items-center md:justify-between" : "",
        )}
      >
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/15 bg-black/40">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={`${founder.companyName} logo`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" style={meshGradient(`${founder.companyName}-logo`)} />
              )}
            </div>
            <div className="absolute -bottom-1 -right-2 h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-black/40 shadow-[0_0_0_2px_rgba(5,5,5,0.9)]">
              {founder.avatarUrl ? (
                <img
                  src={founder.avatarUrl}
                  alt={founder.founderName}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" style={meshGradient(`${founder.founderName}-avatar`)} />
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={profileUrl}
                className="truncate text-[1.1rem] font-semibold text-white transition-colors hover:text-indigo-200"
              >
                {founder.founderName}
              </Link>

              {founder.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.95)]" />
                  Verified
                </span>
              ) : null}
              {isTrending ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300">
                  <Flame className="h-3.5 w-3.5" />
                  Trending
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm font-medium text-zinc-400">{founder.companyName}</p>
            <p className="mt-2 text-sm text-zinc-500">{founder.productSummary}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-indigo-300" />
                {founder.stage}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-300" />
                {location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users2 className="h-3.5 w-3.5 text-indigo-300" />
                {employeeCount} Employees
              </span>
            </div>
          </div>
        </div>

        <div className={cn("flex items-center gap-2", featured ? "md:shrink-0" : "")}>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            Unlock Contact
          </Link>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${founder.founderName} on LinkedIn`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <Link
            href={`/signals?founder=${encodeURIComponent(founder.founderName)}`}
            aria-label={`Track ${founder.founderName}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share ${founder.founderName} profile`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            <Share2 className="h-4 w-4" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
