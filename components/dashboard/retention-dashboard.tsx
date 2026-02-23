"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Bell, BookmarkPlus, CheckCircle2, Crown, Loader2, Radar, Search, Sparkles } from "lucide-react";
import { ClaimPanel } from "@/components/dashboard/claim-panel";
import { ProfileSettingsPanel } from "@/components/dashboard/profile-settings-panel";
import { AdminConnectorsPanel } from "@/components/dashboard/admin-connectors-panel";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_FREE_LIMITS,
  SEARCH_TYPE_VALUES,
  type DashboardEntityType,
  type DashboardFeedItem,
  type DashboardNotification,
  type DashboardPreference,
  type DashboardSummary,
  type SavedSearchItem,
  type WatchlistItem,
} from "@/lib/dashboard/types";

type FounderOption = {
  slug: string;
  founderName: string;
  companyName: string;
};

type CompanyOption = {
  companySlug: string;
  companyName: string;
  founderName: string;
};

type TopicOption = {
  slug: string;
  label: string;
  count: number;
};

type ClaimTimelineItem = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  founderEntry: {
    slug: string;
    founderName: string;
    companyName: string;
  };
};

type Connector = {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  authHeader: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
};

type RetentionDashboardProps = {
  session: {
    email: string;
    role: "ADMIN" | "MEMBER";
  };
  profileName: string | null;
  profileAvatarUrl: string | null;
  founderOptions: FounderOption[];
  companyOptions: CompanyOption[];
  topicOptions: TopicOption[];
  claims: ClaimTimelineItem[];
  adminConnectors: Connector[];
};

type ApiResponse<T> = {
  success: boolean;
  error?: string;
} & T;

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  const result = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !result?.success) {
    throw new Error(result?.error ?? "Request failed");
  }
  return result as unknown as T;
};

const TAB_KEYS = ["overview", "watchlist", "profile"] as const;
type DashboardTab = (typeof TAB_KEYS)[number];

const DEFAULT_PREFERENCES: DashboardPreference = {
  instantEmail: false,
  dailyDigest: true,
  weeklyDigest: false,
  premiumOptIn: false,
  updatedAt: null,
};

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(parsed));
}

function statusChipClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED" || normalized === "PUBLISHED") {
    return "border-emerald-400/35 bg-emerald-500/10 text-emerald-200";
  }
  if (normalized === "REJECTED") {
    return "border-red-400/35 bg-red-500/10 text-red-200";
  }
  if (normalized === "IN_REVIEW") {
    return "border-amber-400/35 bg-amber-500/10 text-amber-200";
  }
  return "border-white/20 bg-black/30 text-zinc-300";
}

function ModuleCard({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left md:pointer-events-none"
      >
        <div>
          <h2 className="text-base font-medium text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-zinc-400">{subtitle}</p> : null}
        </div>
        <span className="text-xs text-zinc-500 md:hidden">{open ? "Hide" : "Show"}</span>
      </button>

      <div className={cn("mt-4", open ? "block" : "hidden md:block")}>{children}</div>
    </section>
  );
}

export function RetentionDashboard({
  session,
  profileName,
  profileAvatarUrl,
  founderOptions,
  companyOptions,
  topicOptions,
  claims,
  adminConnectors,
}: RetentionDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [watchType, setWatchType] = useState<DashboardEntityType>("founder");
  const [watchSlug, setWatchSlug] = useState(founderOptions[0]?.slug ?? "");
  const [watchStatus, setWatchStatus] = useState<string | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [watchSaving, setWatchSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<(typeof SEARCH_TYPE_VALUES)[number]>("all");
  const [searchSaving, setSearchSaving] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [prefState, setPrefState] = useState<DashboardPreference>(DEFAULT_PREFERENCES);
  const [prefDirty, setPrefDirty] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefStatus, setPrefStatus] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  const summaryQuery = useSWR<{ summary: DashboardSummary }>(
    "/api/dashboard/summary",
    fetcher,
  );
  const watchlistQuery = useSWR<{ items: WatchlistItem[] }>(
    "/api/dashboard/watchlist",
    fetcher,
  );
  const feedQuery = useSWR<{ items: DashboardFeedItem[] }>(
    "/api/dashboard/feed?limit=14",
    fetcher,
  );
  const savedSearchQuery = useSWR<{ items: SavedSearchItem[] }>(
    "/api/dashboard/saved-searches",
    fetcher,
  );
  const notificationsQuery = useSWR<{ items: DashboardNotification[] }>(
    "/api/dashboard/notifications?limit=20",
    fetcher,
  );
  const preferencesQuery = useSWR<{ preference: DashboardPreference }>(
    "/api/dashboard/preferences",
    fetcher,
    {
      onSuccess: (payload) => {
        if (!prefDirty) {
          setPrefState(payload.preference ?? DEFAULT_PREFERENCES);
        }
      },
    },
  );

  const watchChoices = useMemo(() => {
    if (watchType === "founder") {
      return founderOptions.map((entry) => ({
        slug: entry.slug,
        label: `${entry.founderName} - ${entry.companyName}`,
      }));
    }

    if (watchType === "company") {
      return companyOptions.map((entry) => ({
        slug: entry.companySlug,
        label: `${entry.companyName} (${entry.founderName})`,
      }));
    }

    return topicOptions.map((entry) => ({
      slug: entry.slug,
      label: `${entry.label} (${entry.count})`,
    }));
  }, [watchType, founderOptions, companyOptions, topicOptions]);

  const selectedWatchLabel =
    watchChoices.find((item) => item.slug === watchSlug)?.label ?? "";

  const watchlistItems = watchlistQuery.data?.items ?? [];
  const savedSearches = savedSearchQuery.data?.items ?? [];
  const notifications = notificationsQuery.data?.items ?? [];
  const feedItems = feedQuery.data?.items ?? [];
  const summary = summaryQuery.data?.summary;

  const recommendedActions = useMemo(() => {
    const actions: Array<{ key: string; title: string; hint: string; tab: DashboardTab }> = [];

    if (watchlistItems.length === 0) {
      actions.push({
        key: "watchlist",
        title: "Add your first tracked entity",
        hint: "Follow founders, companies, or topics to unlock a personalized dashboard feed.",
        tab: "watchlist",
      });
    }
    if (savedSearches.length === 0) {
      actions.push({
        key: "search",
        title: "Save your first search",
        hint: "Reuse high-intent queries and rerun them in one click.",
        tab: "watchlist",
      });
    }
    if (!(prefState.dailyDigest ?? true)) {
      actions.push({
        key: "digest",
        title: "Enable daily digest",
        hint: "Get daily inbox updates from your tracked list.",
        tab: "watchlist",
      });
    }
    if (claims.length === 0) {
      actions.push({
        key: "claim",
        title: "Claim your founder profile",
        hint: "Increase trust and conversion with profile verification.",
        tab: "profile",
      });
    }

    return actions.slice(0, 4);
  }, [watchlistItems.length, savedSearches.length, prefState.dailyDigest, claims.length]);

  function setTab(tab: DashboardTab) {
    setActiveTab(tab);
  }

  async function addWatchItem() {
    if (!watchSlug || !selectedWatchLabel) {
      setWatchError("Select an entity first.");
      setWatchStatus(null);
      return;
    }

    setWatchSaving(true);
    setWatchError(null);
    setWatchStatus(null);

    try {
      const response = await fetch("/api/dashboard/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: watchType,
          entitySlug: watchSlug,
          entityName: selectedWatchLabel,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.success) {
        setWatchError(result?.error ?? "Unable to add watch item.");
        return;
      }

      setWatchStatus("Added to your watchlist.");
      await Promise.all([
        watchlistQuery.mutate(),
        summaryQuery.mutate(),
        feedQuery.mutate(),
      ]);
    } catch {
      setWatchError("Unable to add watch item.");
    } finally {
      setWatchSaving(false);
    }
  }

  async function removeWatchItem(id: string) {
    const response = await fetch(`/api/dashboard/watchlist/${id}`, {
      method: "DELETE",
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;

    if (!response.ok || !result?.success) {
      setWatchError(result?.error ?? "Unable to remove watch item.");
      setWatchStatus(null);
      return;
    }

    setWatchError(null);
    setWatchStatus("Watchlist updated.");
    await Promise.all([
      watchlistQuery.mutate(),
      summaryQuery.mutate(),
      feedQuery.mutate(),
    ]);
  }

  async function addSavedSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError("Enter a search query.");
      setSearchStatus(null);
      return;
    }

    setSearchSaving(true);
    setSearchError(null);
    setSearchStatus(null);

    try {
      const response = await fetch("/api/dashboard/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          type: searchType,
          filtersJson: null,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !result?.success) {
        setSearchError(result?.error ?? "Unable to save search.");
        return;
      }

      setSearchStatus("Saved search added.");
      setSearchQuery("");
      await Promise.all([savedSearchQuery.mutate(), summaryQuery.mutate()]);
    } catch {
      setSearchError("Unable to save search.");
    } finally {
      setSearchSaving(false);
    }
  }

  async function removeSavedSearch(id: string) {
    const response = await fetch(`/api/dashboard/saved-searches/${id}`, {
      method: "DELETE",
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;

    if (!response.ok || !result?.success) {
      setSearchError(result?.error ?? "Unable to delete saved search.");
      setSearchStatus(null);
      return;
    }

    setSearchError(null);
    setSearchStatus("Saved searches updated.");
    await Promise.all([savedSearchQuery.mutate(), summaryQuery.mutate()]);
  }

  async function markNotificationAsRead(id: string) {
    const response = await fetch(`/api/dashboard/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;

    if (!response.ok || !result?.success) {
      return;
    }

    await Promise.all([notificationsQuery.mutate(), summaryQuery.mutate()]);
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPrefSaving(true);
    setPrefError(null);
    setPrefStatus(null);

    try {
      const response = await fetch("/api/dashboard/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instantEmail: prefState.instantEmail,
          dailyDigest: prefState.dailyDigest,
          weeklyDigest: prefState.weeklyDigest,
          premiumOptIn: prefState.premiumOptIn,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        preference?: DashboardPreference;
      } | null;

      if (!response.ok || !result?.success) {
        setPrefError(result?.error ?? "Unable to save preferences.");
        return;
      }

      setPrefState(result.preference ?? prefState);
      setPrefDirty(false);
      setPrefStatus("Preferences updated.");
      await Promise.all([preferencesQuery.mutate(), summaryQuery.mutate()]);
    } catch {
      setPrefError("Unable to save preferences.");
    } finally {
      setPrefSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Logged in as {session.email} ({session.role})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/founders"
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            Browse Directory
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
          >
            Upgrade Insights
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Tracked Entities</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summaryQuery.isLoading ? "…" : summary?.trackedCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Unread Alerts</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summaryQuery.isLoading ? "…" : summary?.unreadAlerts ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Saved Searches</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summaryQuery.isLoading ? "…" : summary?.savedSearchCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Profile Strength</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summaryQuery.isLoading ? "…" : `${summary?.profileStrength ?? 0}%`}
          </p>
        </div>
      </section>

      <div className="inline-flex w-full rounded-xl border border-white/15 bg-white/[0.03] p-1 sm:w-auto">
        {(TAB_KEYS as readonly DashboardTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm capitalize transition-colors sm:flex-none",
              activeTab === tab
                ? "bg-indigo-500/20 text-indigo-200"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {tab === "watchlist" ? "Watchlist & Alerts" : tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <ModuleCard
            title="My Feed"
            subtitle="Latest signal and newsroom updates from your tracked entities."
          >
            <div className="space-y-3">
              {feedQuery.isLoading ? (
                <p className="text-sm text-zinc-400">Loading feed...</p>
              ) : null}
              {feedItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                      {item.kind}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    {item.entityName} • {formatDate(item.createdAt)}
                  </p>
                </Link>
              ))}
              {!feedQuery.isLoading && feedItems.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-400">
                  No personalized feed yet. Add founders, companies, or topics to watch.
                </p>
              ) : null}
            </div>
          </ModuleCard>

          <div className="space-y-4">
            <ModuleCard
              title="Recommended Actions"
              subtitle="Quick wins to improve profile visibility and retention."
            >
              <div className="space-y-2">
                {recommendedActions.length === 0 ? (
                  <p className="text-sm text-zinc-400">All core setup actions completed.</p>
                ) : (
                  recommendedActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => setTab(action.tab)}
                      className="w-full rounded-lg border border-white/10 bg-black/30 p-3 text-left transition-colors hover:border-white/25"
                    >
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{action.hint}</p>
                    </button>
                  ))
                )}
              </div>
            </ModuleCard>

            <ModuleCard
              title="Premium Insights"
              subtitle="Unlock instant alerts and AI weekly intelligence."
              defaultOpen={false}
            >
              <div className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-3">
                <div className="flex items-start gap-2">
                  <Crown className="mt-0.5 h-4 w-4 text-indigo-200" />
                  <div>
                    <p className="text-sm text-indigo-100">
                      Premium features are locked for your current plan.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-indigo-200/90">
                      <li>Unlimited watchlist tracking</li>
                      <li>Instant email signal alerts</li>
                      <li>AI weekly intelligence summary</li>
                    </ul>
                    <Link
                      href="/pricing"
                      className="mt-3 inline-flex rounded-md border border-indigo-300/35 bg-indigo-500/20 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:bg-indigo-500/30"
                    >
                      Upgrade to Premium
                    </Link>
                  </div>
                </div>
              </div>
            </ModuleCard>
          </div>

          <ModuleCard
            title="Claim Status Timeline"
            subtitle="Track profile verification and review workflow."
          >
            <div className="space-y-2">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-zinc-100">
                      {claim.founderEntry.founderName} - {claim.founderEntry.companyName}
                    </p>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", statusChipClass(claim.status))}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Submitted {formatDate(claim.createdAt)}
                    {claim.reviewedAt ? ` • Reviewed ${formatDate(claim.reviewedAt)}` : ""}
                  </p>
                </div>
              ))}
              {claims.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No claim requests yet. Submit one in Profile & Claims.
                </p>
              ) : null}
            </div>
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "watchlist" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ModuleCard
            title="Watchlist Manager"
            subtitle={`Track up to ${DASHBOARD_FREE_LIMITS.watchlistItems} entities on the free plan.`}
          >
            <div className="space-y-3">
              <div className="inline-flex rounded-md border border-white/15 bg-white/[0.03] p-1">
                {(["founder", "company", "topic"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setWatchType(value);
                      setWatchSlug(
                        value === "founder"
                          ? founderOptions[0]?.slug ?? ""
                          : value === "company"
                            ? companyOptions[0]?.companySlug ?? ""
                            : topicOptions[0]?.slug ?? "",
                      );
                      setWatchError(null);
                      setWatchStatus(null);
                    }}
                    className={cn(
                      "rounded px-3 py-1.5 text-xs uppercase tracking-[0.1em]",
                      watchType === value
                        ? "bg-indigo-500/20 text-indigo-200"
                        : "text-zinc-400 hover:text-white",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <select
                value={watchSlug}
                onChange={(event) => setWatchSlug(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              >
                {watchChoices.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addWatchItem}
                disabled={watchSaving || !watchSlug}
                className="sticky bottom-3 z-10 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:cursor-not-allowed disabled:opacity-70 md:static md:w-auto"
              >
                {watchSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Radar className="h-4 w-4" />
                    Add Watch
                  </>
                )}
              </button>

              {watchStatus ? <p className="text-xs text-emerald-300">{watchStatus}</p> : null}
              {watchError ? <p className="text-xs text-red-400">{watchError}</p> : null}
            </div>

            <div className="mt-4 space-y-2">
              {watchlistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-zinc-100">{item.entityName}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                      {item.entityType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWatchItem(item.id)}
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {watchlistQuery.isLoading ? (
                <p className="text-xs text-zinc-500">Loading watchlist...</p>
              ) : null}
              {!watchlistQuery.isLoading && watchlistItems.length === 0 ? (
                <p className="text-xs text-zinc-500">No watchlist items added yet.</p>
              ) : null}
            </div>
          </ModuleCard>

          <ModuleCard
            title="Saved Searches"
            subtitle={`Store up to ${DASHBOARD_FREE_LIMITS.savedSearches} reusable searches.`}
          >
            <form className="space-y-2" onSubmit={addSavedSearch}>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="e.g. top ai infrastructure founders"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <div className="flex gap-2">
                <select
                  value={searchType}
                  onChange={(event) =>
                    setSearchType(event.target.value as (typeof SEARCH_TYPE_VALUES)[number])
                  }
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
                >
                  {SEARCH_TYPE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={searchSaving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#6366f1] px-3 py-2 text-sm text-white transition-colors hover:bg-[#5558ea] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {searchSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </form>

            {searchStatus ? <p className="mt-2 text-xs text-emerald-300">{searchStatus}</p> : null}
            {searchError ? <p className="mt-2 text-xs text-red-400">{searchError}</p> : null}

            <div className="mt-4 space-y-2">
              {savedSearches.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <p className="text-sm text-white">{item.query}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-zinc-500">
                    {item.type}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Link
                      href={`/search?q=${encodeURIComponent(item.query)}${item.type !== "all" ? `&type=${encodeURIComponent(item.type)}` : ""}`}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                    >
                      Run Search
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeSavedSearch(item.id)}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {savedSearchQuery.isLoading ? (
                <p className="text-xs text-zinc-500">Loading saved searches...</p>
              ) : null}
              {!savedSearchQuery.isLoading && savedSearches.length === 0 ? (
                <p className="text-xs text-zinc-500">No saved searches yet.</p>
              ) : null}
            </div>
          </ModuleCard>

          <ModuleCard
            title="Notification Center"
            subtitle="Read and manage in-app updates from your tracked entities."
          >
            <div className="space-y-2">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-3",
                    item.isRead
                      ? "border-white/10 bg-black/25"
                      : "border-indigo-400/35 bg-indigo-500/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-zinc-300">{item.body}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{formatDate(item.createdAt)}</p>
                    </div>
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(item.id)}
                        className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-white/30"
                      >
                        Mark Read
                      </button>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    )}
                  </div>
                  {item.targetUrl ? (
                    <Link
                      href={item.targetUrl}
                      className="mt-2 inline-flex text-xs text-indigo-300 hover:text-indigo-200"
                    >
                      Open related page
                    </Link>
                  ) : null}
                </div>
              ))}
              {notificationsQuery.isLoading ? (
                <p className="text-xs text-zinc-500">Loading notifications...</p>
              ) : null}
              {!notificationsQuery.isLoading && notifications.length === 0 ? (
                <p className="text-xs text-zinc-500">No notifications yet.</p>
              ) : null}
            </div>
          </ModuleCard>

          <ModuleCard
            title="Email Preferences"
            subtitle="Control digest and instant signal email behavior."
            defaultOpen={false}
          >
            <form className="space-y-3" onSubmit={savePreferences}>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <Bell className="h-4 w-4 text-zinc-400" />
                  Instant email alerts
                </span>
                <input
                  type="checkbox"
                  checked={prefState.instantEmail}
                  onChange={(event) => {
                    setPrefState((current) => ({ ...current, instantEmail: event.target.checked }));
                    setPrefDirty(true);
                  }}
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4 text-zinc-400" />
                  Daily digest
                </span>
                <input
                  type="checkbox"
                  checked={prefState.dailyDigest}
                  onChange={(event) => {
                    setPrefState((current) => ({ ...current, dailyDigest: event.target.checked }));
                    setPrefDirty(true);
                  }}
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-zinc-400" />
                  Weekly intelligence digest
                </span>
                <input
                  type="checkbox"
                  checked={prefState.weeklyDigest}
                  onChange={(event) => {
                    setPrefState((current) => ({ ...current, weeklyDigest: event.target.checked }));
                    setPrefDirty(true);
                  }}
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-indigo-400/35 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100">
                <span className="inline-flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Notify me when premium unlocks
                </span>
                <input
                  type="checkbox"
                  checked={prefState.premiumOptIn}
                  onChange={(event) => {
                    setPrefState((current) => ({ ...current, premiumOptIn: event.target.checked }));
                    setPrefDirty(true);
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={prefSaving}
                className="inline-flex items-center gap-2 rounded-md bg-[#6366f1] px-3 py-2 text-sm text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
              >
                {prefSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </button>

              {prefStatus ? <p className="text-xs text-emerald-300">{prefStatus}</p> : null}
              {prefError ? <p className="text-xs text-red-400">{prefError}</p> : null}
            </form>
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <div className="space-y-4">
          <ProfileSettingsPanel
            email={session.email}
            initialName={profileName}
            initialAvatarUrl={profileAvatarUrl}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ClaimPanel founderOptions={founderOptions} />

            <section className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <h2 className="text-base font-medium text-white">My Claim Requests</h2>
              <div className="mt-4 space-y-3">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="rounded-lg border border-white/10 bg-black/30 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-zinc-200">
                        {claim.founderEntry.founderName} - {claim.founderEntry.companyName}
                      </p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", statusChipClass(claim.status))}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Submitted {formatDate(claim.createdAt)}
                      {claim.reviewedAt ? ` • Reviewed ${formatDate(claim.reviewedAt)}` : ""}
                    </p>
                    {claim.message ? <p className="mt-1 text-xs text-zinc-400">{claim.message}</p> : null}
                  </div>
                ))}
                {claims.length === 0 ? (
                  <p className="text-xs text-zinc-500">No claims submitted yet.</p>
                ) : null}
              </div>
            </section>
          </div>

          {session.role === "ADMIN" ? (
            <AdminConnectorsPanel initialConnectors={adminConnectors} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
