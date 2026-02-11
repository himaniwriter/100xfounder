import { CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export type Founder = {
  id: string;
  name: string;
  startup: string;
  industry: "SaaS" | "AI" | "Crypto";
  location: "SF" | "NYC" | "London";
  stage: "Seed" | "Series A";
  avatarUrl?: string;
  verified: boolean;
};

type FounderCardProps = {
  founder: Founder;
};

export function FounderCard({ founder }: FounderCardProps) {
  const initials = founder.name
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
            alt={founder.name}
            className="h-12 w-12 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/5 font-mono text-sm text-zinc-200">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-medium text-white">{founder.name}</h3>
            {founder.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-zinc-400">{founder.startup}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {founder.industry}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {founder.location}
            </span>
            <span className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300">
              {founder.stage}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
