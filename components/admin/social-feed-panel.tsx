"use client";

import useSWR from "swr";

type FeedItem = {
  id: string;
  external_post_id: string;
  caption: string | null;
  media_url: string;
  permalink: string;
  thumbnail_url: string | null;
  posted_at: string;
  ingested_at: string;
};

type FeedResponse = {
  success: true;
  updatedAt: string;
  items: FeedItem[];
};

const fetcher = async (url: string): Promise<FeedResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load instagram feed");
  }
  return result;
};

export function SocialFeedPanel() {
  const { data, error, isLoading, mutate } = useSWR("/api/instagram/feed?limit=30", fetcher);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Social Feed</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Preview recently ingested Instagram posts used on homepage and Get Featured.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void mutate()}
          className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/30"
        >
          Refresh
        </button>
      </div>

      {isLoading ? <p className="text-sm text-zinc-400">Loading social feed...</p> : null}
      {error ? <p className="text-sm text-red-300">{(error as Error).message}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(data?.items ?? []).map((item) => (
          <article
            key={item.external_post_id}
            className="overflow-hidden rounded-xl border border-white/15 bg-white/[0.03]"
          >
            <img
              src={item.thumbnail_url || item.media_url}
              alt={item.caption || "Instagram post"}
              loading="lazy"
              className="h-44 w-full object-cover"
            />
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-sm text-zinc-200">{item.caption || "Instagram post"}</p>
              <p className="text-xs text-zinc-500">Posted {new Date(item.posted_at).toLocaleString()}</p>
              <a
                href={item.permalink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-white/30"
              >
                Open Post
              </a>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && !error && (data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-zinc-500">No instagram posts ingested yet.</p>
      ) : null}
    </div>
  );
}
