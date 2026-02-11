import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import type { FounderDirectoryItem } from "@/lib/founders/types";

type FounderCardProps = {
  founder: FounderDirectoryItem;
};

export function FounderCard({ founder }: FounderCardProps) {
  const initials = founder.founderName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <GlassCard className="p-5">
      <div className="flex items-start gap-3">
        {founder.avatarUrl ? (
          <img
            src={founder.avatarUrl}
            alt={founder.founderName}
            className="h-12 w-12 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 font-mono text-sm text-zinc-200">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/founders/${founder.slug}`}
              className="truncate text-base font-medium text-white transition-colors hover:text-indigo-300"
            >
              {founder.founderName}
            </Link>
            {founder.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-zinc-300">{founder.companyName}</p>
          <p className="mt-1 text-xs text-zinc-500">{founder.productSummary}</p>
          {founder.fundingInfo ? (
            <p className="mt-1 text-xs text-indigo-300">{founder.fundingInfo}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {founder.industry}
            </span>
            {founder.headquarters ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                {founder.headquarters}
              </span>
            ) : null}
            <span className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300">
              {founder.stage}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 text-xs">
            <Link
              href={`/founders/${founder.slug}`}
              className="text-indigo-300 transition-colors hover:text-indigo-200"
            >
              View Profile
            </Link>
            {founder.ycProfileUrl ? (
              <a
                href={founder.ycProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 transition-colors hover:text-zinc-200"
              >
                YC Founders
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
