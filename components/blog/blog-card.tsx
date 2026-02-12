import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog/types";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
  variant?: "hero" | "stack" | "feed";
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function MetaRow({ post, compact = false }: { post: BlogPost; compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs text-zinc-400", compact ? "mt-2" : "mt-3") }>
      <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 uppercase tracking-wide text-zinc-200">
        {post.category}
      </span>
      <span>{post.readingTime}</span>
      <span>{formatDate(post.publishedAt)}</span>
      <span className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-zinc-300">
        {post.sourceName ?? "100Xfounder"}
      </span>
    </div>
  );
}

export function BlogCard({ post, className, variant = "feed" }: BlogCardProps) {
  if (variant === "hero") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "group grid overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] transition-all duration-300 hover:border-white/25 hover:bg-white/[0.05]",
          "lg:grid-cols-[1.05fr_minmax(0,1fr)]",
          className,
        )}
      >
        <NewsCoverImage
          title={post.title}
          imageUrl={post.thumbnail}
          uniqueId={post.slug}
          className="h-64 w-full lg:h-full"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="flex flex-col p-5 lg:p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Lead Story</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white lg:text-[31px] lg:leading-[1.12]">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm text-zinc-300 lg:text-base">{post.excerpt}</p>
          <MetaRow post={post} />
          {post.sourceUrl ? (
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-indigo-300">
              Original reporting link
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
      </Link>
    );
  }

  if (variant === "stack") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "group grid grid-cols-[120px_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-2.5 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.04]",
          className,
        )}
      >
        <NewsCoverImage
          title={post.title}
          imageUrl={post.thumbnail}
          uniqueId={post.slug}
          className="h-[92px] w-full rounded-lg"
          imageClassName="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold text-white">{post.title}</h3>
          <MetaRow post={post} compact />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group grid gap-4 rounded-xl border border-white/10 bg-black/30 p-3 transition-all duration-300 hover:border-white/25 hover:bg-white/[0.03] sm:grid-cols-[220px_minmax(0,1fr)]",
        className,
      )}
    >
      <NewsCoverImage
        title={post.title}
        imageUrl={post.thumbnail}
        uniqueId={post.slug}
        className="h-36 w-full rounded-lg sm:h-full"
        imageClassName="transition-transform duration-500 group-hover:scale-105"
      />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-white">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{post.excerpt}</p>
        <MetaRow post={post} />
      </div>
    </Link>
  );
}
