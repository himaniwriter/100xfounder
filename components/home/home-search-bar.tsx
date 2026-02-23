"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { trackSiteEvent } from "@/lib/client-tracking";

const TRENDING_QUERIES = [
  "Top startup company names in India",
  "Top founders of 2025 list",
  "OpenAI latest funding round",
  "Aravind Srinivas profile",
  "Perplexity hiring roles",
  "Indian fintech startups hiring now",
  "US AI infrastructure companies",
];

const TYPE_SPEED_MS = 52;
const ERASE_SPEED_MS = 34;
const PAUSE_AFTER_TYPE_MS = 1200;
const PAUSE_AFTER_ERASE_MS = 260;

export function HomeSearchBar() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const activeQuery = TRENDING_QUERIES[queryIndex % TRENDING_QUERIES.length] ?? "";

  useEffect(() => {
    const finishedTyping = typedText.length >= activeQuery.length;
    const finishedDeleting = typedText.length === 0;

    let nextDelay = deleting ? ERASE_SPEED_MS : TYPE_SPEED_MS;
    if (!deleting && finishedTyping) {
      nextDelay = PAUSE_AFTER_TYPE_MS;
    } else if (deleting && finishedDeleting) {
      nextDelay = PAUSE_AFTER_ERASE_MS;
    }

    const timer = window.setTimeout(() => {
      if (!deleting && finishedTyping) {
        setDeleting(true);
        return;
      }

      if (deleting && finishedDeleting) {
        setDeleting(false);
        setQueryIndex((current) => (current + 1) % TRENDING_QUERIES.length);
        return;
      }

      if (deleting) {
        setTypedText((current) => current.slice(0, -1));
      } else {
        setTypedText(activeQuery.slice(0, typedText.length + 1));
      }
    }, nextDelay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeQuery, deleting, typedText]);

  function openCommandPalette(seedQuery?: string) {
    const normalizedSeed = seedQuery?.trim();

    window.dispatchEvent(
      new CustomEvent("open-command-palette", {
        detail: normalizedSeed ? { query: normalizedSeed } : {},
      }),
    );

    if (normalizedSeed) {
      trackSiteEvent({
        event_name: "search_submit",
        path: "/",
        payload: {
          query: normalizedSeed,
          source: "home_hero_trending_seed",
        },
      });
      return;
    }

    trackSiteEvent({
      event_name: "cta_click",
      path: "/",
      payload: {
        source: "home_hero",
        target: "command_palette",
      },
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => openCommandPalette()}
        className="group relative flex h-14 w-full items-center gap-3 overflow-hidden rounded-xl border border-white/15 bg-black/45 px-4 text-left transition-all duration-300 hover:border-indigo-400/45 hover:bg-black/55 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Search className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-hover:text-indigo-200" />
        <span className="min-w-0 flex-1 text-sm text-zinc-200">
          <span className="sr-only">Open search</span>
          <span className="inline text-zinc-500">Try: </span>
          <span className="inline text-zinc-100">{typedText}</span>
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-indigo-300 align-middle" />
        </span>
        <span className="hidden rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-zinc-400 sm:inline-flex">
          Cmd/Ctrl + K
        </span>
      </button>

      <div className="flex flex-wrap gap-2">
        {TRENDING_QUERIES.slice(0, 5).map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => openCommandPalette(query)}
            className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-indigo-400/45 hover:bg-indigo-500/15 hover:text-indigo-100"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
