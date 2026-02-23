"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackSiteEvent } from "@/lib/client-tracking";

type SearchPageFormProps = {
  initialQuery: string;
  initialType: "all" | "founder" | "company" | "blog" | "signal" | "topic";
};

export function SearchPageForm({ initialQuery, initialType }: SearchPageFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    trackSiteEvent({
      event_name: "search_submit",
      path: "/search",
      payload: {
        query: nextQuery,
        type,
        source: "search_page",
      },
    });

    const params = new URLSearchParams();
    params.set("q", nextQuery);
    if (type !== "all") {
      params.set("type", type);
    }

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search founders, companies, signals, topics, articles"
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as "all" | "founder" | "company" | "blog" | "signal" | "topic")
          }
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
        >
          <option value="all">All</option>
          <option value="founder">Founders</option>
          <option value="company">Companies</option>
          <option value="signal">Signals</option>
          <option value="topic">Topics</option>
          <option value="blog">Articles</option>
        </select>
        <button
          type="submit"
          className="h-11 rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea]"
        >
          Search
        </button>
      </div>
    </form>
  );
}
