"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackSiteEvent } from "@/lib/client-tracking";

export function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    trackSiteEvent({
      event_name: "search_submit",
      path: "/",
      payload: {
        query: nextQuery,
        source: "home_hero",
      },
    });

    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-4">
      <Search className="h-5 w-5 text-zinc-400" />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search founders, startups, and signals..."
        className="h-full flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400 transition-colors hover:text-zinc-200"
      >
        Search
      </button>
    </form>
  );
}
