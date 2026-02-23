"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Command, Search } from "lucide-react";
import { trackSiteEvent } from "@/lib/client-tracking";
import type { SearchApiResponse } from "@/lib/search/types";

type PaletteItem = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Founders" | "Companies" | "Articles" | "Signals" | "Topics" | "Quick Actions";
};

const QUICK_ACTIONS: PaletteItem[] = [
  {
    key: "quick-founders",
    title: "Browse Founders",
    subtitle: "Discover verified founders and company profiles",
    href: "/founders",
    group: "Quick Actions",
  },
  {
    key: "quick-signals",
    title: "Open Signals Feed",
    subtitle: "Live funding and hiring movement",
    href: "/signals",
    group: "Quick Actions",
  },
  {
    key: "quick-newsroom",
    title: "Go to Newsroom",
    subtitle: "Latest startup news and analysis",
    href: "/blog",
    group: "Quick Actions",
  },
  {
    key: "quick-topics",
    title: "Explore Topics",
    subtitle: "Topic hubs for startup themes",
    href: "/topics",
    group: "Quick Actions",
  },
  {
    key: "quick-featured",
    title: "Get Featured",
    subtitle: "Apply for founder profile visibility",
    href: "/get-featured",
    group: "Quick Actions",
  },
];

const PALETTE_TRENDING_QUERIES = [
  "Top startup company names in India",
  "Top founders of 2025 list",
  "OpenAI latest funding round",
  "Aravind Srinivas profile",
  "Perplexity hiring roles",
  "Indian fintech startups hiring now",
  "US AI infrastructure companies",
];

function toPaletteItems(data: SearchApiResponse | null): PaletteItem[] {
  if (!data) {
    return [];
  }

  const founderItems: PaletteItem[] = data.results.founders.map((item) => ({
    key: `founder-${item.slug}`,
    title: item.founderName,
    subtitle: `${item.companyName} • ${item.industry} • ${item.stage}`,
    href: `/founders/${item.slug}`,
    group: "Founders",
  }));

  const companyItems: PaletteItem[] = data.results.companies.map((item) => ({
    key: `company-${item.companySlug}`,
    title: item.companyName,
    subtitle: `${item.industry} • ${item.stage} • ${item.funding}`,
    href: `/company/${item.companySlug}`,
    group: "Companies",
  }));

  const articleItems: PaletteItem[] = data.results.posts.map((item) => ({
    key: `post-${item.slug}`,
    title: item.title,
    subtitle: item.excerpt,
    href: `/blog/${item.slug}`,
    group: "Articles",
  }));

  const signalItems: PaletteItem[] = data.results.signals.map((item) => ({
    key: `signal-${item.id}`,
    title: `${item.companyName} • ${item.lastRound}`,
    subtitle: `${item.country} • ${item.industry} • ${item.isHiring ? "Hiring now" : "Not hiring"}`,
    href: `/company/${item.companySlug}`,
    group: "Signals",
  }));

  const topicItems: PaletteItem[] = data.results.topics.map((item) => ({
    key: `topic-${item.slug}`,
    title: item.label,
    subtitle: `${item.count} stories in this topic`,
    href: `/topics/${item.slug}`,
    group: "Topics",
  }));

  return [...founderItems, ...companyItems, ...articleItems, ...signalItems, ...topicItems];
}

export function GlobalCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const trimmedQuery = query.trim();

  const items = useMemo(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) {
      return QUICK_ACTIONS;
    }

    const searched = toPaletteItems(results);
    if (searched.length > 0) {
      return searched;
    }

    return [];
  }, [results, trimmedQuery]);

  useEffect(() => {
    function onGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) => {
          if (items.length === 0) {
            return 0;
          }
          return (current + 1) % items.length;
        });
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((current) => {
          if (items.length === 0) {
            return 0;
          }
          return (current - 1 + items.length) % items.length;
        });
      }

      if (event.key === "Enter") {
        const selected = items[selectedIndex];
        if (!selected) {
          return;
        }
        event.preventDefault();
        trackSiteEvent({
          event_name: "search_submit",
          path: pathname || "/",
          payload: {
            query: trimmedQuery || selected.title,
            source: "command_palette",
            destination: selected.href,
            group: selected.group,
          },
        });
        setOpen(false);
        router.push(selected.href);
      }
    }

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, [items, open, pathname, router, selectedIndex, trimmedQuery]);

  useEffect(() => {
    function onOpenEvent(event: Event) {
      const customEvent = event as CustomEvent<{ query?: string }>;
      const seededQuery = customEvent.detail?.query?.trim() ?? "";
      setOpen(true);
      if (seededQuery) {
        setQuery(seededQuery);
        setSelectedIndex(0);
      }
    }

    window.addEventListener("open-command-palette", onOpenEvent as EventListener);
    return () => {
      window.removeEventListener("open-command-palette", onOpenEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}&type=all&limit=8`,
          {
            method: "GET",
            signal: abortController.signal,
            cache: "no-store",
          },
        );

        const data = (await response.json()) as SearchApiResponse & { error?: string };
        if (!response.ok || !data.success) {
          setResults(null);
          setError(data.error ?? "Search failed.");
          setLoading(false);
          return;
        }

        setResults(data);
        setLoading(false);
      } catch (fetchError) {
        if (abortController.signal.aborted) {
          return;
        }
        setResults(null);
        setError(fetchError instanceof Error ? fetchError.message : "Search failed.");
        setLoading(false);
      }
    }, 180);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [open, trimmedQuery, loading, items.length]);

  function applyTrendingQuery(nextQuery: string) {
    setQuery(nextQuery);
    setSelectedIndex(0);
    inputRef.current?.focus();
    trackSiteEvent({
      event_name: "cta_click",
      path: pathname || "/",
      payload: {
        source: "command_palette_ticker",
        query: nextQuery,
      },
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Global search command palette"
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-[#0b0c12]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles, founders, companies, signals, topics"
            className="h-9 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <span className="hidden items-center gap-1 rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] text-zinc-400 sm:inline-flex">
            <Command className="h-3 w-3" />
            K
          </span>
        </div>

        <div className="border-b border-white/10 bg-[#0d1020]/45">
          <div className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            <span>Trending now</span>
          </div>
          <div className="overflow-hidden pb-2">
            <div className="command-palette-ticker-track">
              {[...PALETTE_TRENDING_QUERIES, ...PALETTE_TRENDING_QUERIES].map((trend, index) => (
                <button
                  key={`palette-trend-${trend}-${index}`}
                  type="button"
                  onClick={() => applyTrendingQuery(trend)}
                  className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-indigo-400/45 hover:bg-indigo-500/15 hover:text-indigo-100"
                >
                  {trend}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-2">
          {!trimmedQuery || trimmedQuery.length < 2 ? (
            <div className="space-y-1.5">
              <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                Quick Actions
              </p>
              {QUICK_ACTIONS.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    setOpen(false);
                    router.push(item.href);
                  }}
                  className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    selectedIndex === index
                      ? "border-indigo-400/45 bg-indigo-500/15"
                      : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div>
                    <p className="text-sm text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                </button>
              ))}
            </div>
          ) : null}

          {trimmedQuery.length >= 2 ? (
            <div className="space-y-1.5">
              {loading ? (
                <div className="space-y-2 p-2">
                  <div className="h-11 animate-pulse rounded-md border border-white/10 bg-white/[0.04]" />
                  <div className="h-11 animate-pulse rounded-md border border-white/10 bg-white/[0.04]" />
                  <div className="h-11 animate-pulse rounded-md border border-white/10 bg-white/[0.04]" />
                </div>
              ) : null}

              {!loading && error ? (
                <div className="rounded-md border border-red-400/35 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm text-zinc-200">No results found for "{trimmedQuery}".</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Try a company name, founder name, funding round, or topic.
                  </p>
                </div>
              ) : null}

              {!loading && !error && items.length > 0
                ? items.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => {
                        trackSiteEvent({
                          event_name: "search_submit",
                          path: pathname || "/",
                          payload: {
                            query: trimmedQuery,
                            source: "command_palette",
                            destination: item.href,
                            group: item.group,
                          },
                        });
                        setOpen(false);
                        router.push(item.href);
                      }}
                      className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                        selectedIndex === index
                          ? "border-indigo-400/45 bg-indigo-500/15"
                          : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div>
                        <p className="text-sm text-white">{item.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{item.subtitle}</p>
                      </div>
                      <span className="shrink-0 rounded border border-white/15 bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em] text-zinc-500">
                        {item.group}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[11px] text-zinc-500">
          <span>Use arrows to navigate and Enter to open</span>
          <span>Esc to close</span>
        </div>
      </section>
    </div>
  );
}
