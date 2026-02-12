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
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";
import { cn } from "@/lib/utils";
import type { FounderDirectoryItem } from "@/lib/founders/types";

type FounderCardProps = {
  founder: FounderDirectoryItem;
  isTrending?: boolean;
  featured?: boolean;
};

export function FounderCard({ founder, isTrending = false, featured = false }: FounderCardProps) {
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
        founder.isFeatured
          ? "border-yellow-300/45 bg-white/[0.03] p-5 backdrop-blur-[40px] shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all hover:border-yellow-300/60 hover:bg-white/[0.045]"
          : "border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px] transition-all hover:border-white/30 hover:bg-white/[0.045] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]",
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
            <CompanyLogo
              companyName={founder.companyName}
              websiteUrl={founder.websiteUrl}
              className="h-14 w-14 rounded-xl border border-white/20"
            />
            <div className="absolute -bottom-1 -right-2 h-9 w-9 overflow-hidden rounded-full border border-white/25 bg-black/40 shadow-[0_0_0_2px_rgba(5,5,5,0.9)]">
              <FounderAvatar
                name={founder.founderName}
                imageUrl={founder.avatarUrl}
                linkedinUrl={founder.linkedinUrl}
                className="h-full w-full"
              />
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

        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            featured ? "md:shrink-0" : "",
          )}
        >
          <Link
            href={profileUrl}
            className="enterprise-primary-btn w-full justify-center sm:w-auto"
          >
            View Contact
          </Link>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${founder.founderName} on LinkedIn`}
            className="enterprise-secondary-icon-btn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <Link
            href={`/signals?founder=${encodeURIComponent(founder.founderName)}`}
            aria-label={`Track ${founder.founderName}`}
            className="enterprise-secondary-icon-btn"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Share ${founder.founderName} profile`}
            className="enterprise-secondary-icon-btn"
          >
            <Share2 className="h-4 w-4" />
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
