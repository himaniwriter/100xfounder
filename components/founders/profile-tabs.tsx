"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FounderDirectoryItem } from "@/lib/founders/types";
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";
import { HalfBlurValue } from "@/components/ui/half-blur-value";

type ProfileTabsProps = {
  founder: FounderDirectoryItem;
  similar: FounderDirectoryItem[];
};

type TabKey = "overview" | "signals" | "news" | "similar";

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "signals", label: "Signals" },
  { id: "news", label: "News" },
  { id: "similar", label: "Similar Founders" },
];

export function ProfileTabs({ founder, similar }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const contact = useMemo(() => {
    const host = founder.websiteUrl
      ? founder.websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      : "company.com";

    return {
      email: `connect@${host}`,
      phone: "+91 98765 43210",
    };
  }, [founder.websiteUrl]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/15 bg-white/[0.03] p-2 backdrop-blur-[40px]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "rounded-lg border border-indigo-400/50 bg-indigo-500/15 px-3 py-1.5 text-sm text-indigo-200"
                : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
          {activeTab === "overview" ? (
            <div>
              <p className="text-sm leading-7 text-zinc-300">{founder.productSummary}</p>
              {founder.fundingInfo ? (
                <p className="mt-4 text-sm leading-7 text-indigo-300">{founder.fundingInfo}</p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "signals" ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Stage</dt>
                <dd className="mt-1 text-sm text-zinc-200">{founder.stage}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Industry</dt>
                <dd className="mt-1 text-sm text-zinc-200">{founder.industry}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Headquarters</dt>
                <dd className="mt-1 text-sm text-zinc-200">{founder.headquarters ?? "India"}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Founded</dt>
                <dd className="mt-1 text-sm text-zinc-200">{founder.foundedYear ?? "N/A"}</dd>
              </div>
            </dl>
          ) : null}

          {activeTab === "news" ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-300">
              {founder.recentNews.slice(0, 4).map((news) => (
                <li key={news}>{news}</li>
              ))}
            </ul>
          ) : null}

          {activeTab === "similar" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {similar.length > 0 ? (
                similar.map((item) => (
                  <Link
                    key={item.id}
                    href={`/founders/${item.slug}`}
                    className="rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0">
                        <CompanyLogo
                          companyName={item.companyName}
                          websiteUrl={item.websiteUrl}
                          className="h-9 w-9 rounded-lg border border-white/20"
                        />
                        <FounderAvatar
                          name={item.founderName}
                          imageUrl={item.avatarUrl}
                          linkedinUrl={item.linkedinUrl}
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border border-white/25 bg-black/30"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.founderName}</p>
                        <p className="mt-1 truncate text-xs text-zinc-400">{item.companyName}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No similar founders available.</p>
              )}
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
            Contact & Verified Info
          </h3>
          <p className="mt-2 text-xs text-zinc-500">
            Identity and data verified by 100Xfounder.
          </p>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="text-sm text-zinc-200">
              Email: <HalfBlurValue value={contact.email} className="font-medium tracking-wide" />
            </p>
            <p className="mt-2 text-sm text-zinc-200">
              Phone: <HalfBlurValue value={contact.phone} className="font-medium tracking-wide" />
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Partial preview shown to signal available verified contact data.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
