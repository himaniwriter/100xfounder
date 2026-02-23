import type { InstagramFeedItem } from "@/lib/outreach/types";

type InstagramFeedGridProps = {
  items: InstagramFeedItem[];
  profileUrl: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

export function InstagramFeedGrid({
  items,
  profileUrl,
  title = "Instagram Feed",
  description = "Latest stories and founder snapshots from @100x.founder.",
  compact = false,
}: InstagramFeedGridProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[40px] sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-pink-400/35 bg-pink-500/10 px-4 text-sm font-medium text-pink-200 transition-colors hover:bg-pink-500/20"
        >
          Follow on Instagram
        </a>
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
        {items.map((post) => (
          <a
            key={post.external_post_id}
            href={post.permalink || profileUrl}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-xl border border-white/10 bg-black/30 transition-colors hover:border-pink-400/35"
          >
            <img
              src={post.thumbnail_url || post.media_url}
              alt={post.caption || "Instagram post"}
              loading="lazy"
              className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${compact ? "h-28 sm:h-32" : "h-28 sm:h-32"}`}
            />
            <div className="border-t border-white/10 px-2.5 py-2 text-[11px] uppercase tracking-[0.12em] text-zinc-400">
              {(post.caption || "Instagram post").slice(0, 44)}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
