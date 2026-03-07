import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog/types";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
  variant?: "hero" | "stack" | "feed";
  priority?: boolean;
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
    <div className={cn("flex flex-wrap items-center gap-2 text-xs text-zinc-500", compact ? "mt-2" : "mt-3")}>
      <Badge variant="default">{post.category}</Badge>
      <span>{post.readingTime}</span>
      <span className="hidden sm:inline">·</span>
      <span className="hidden sm:inline">{formatDate(post.publishedAt)}</span>
      {post.sourceName ? (
        <Badge variant="ghost">{post.sourceName}</Badge>
      ) : null}
    </div>
  );
}

export function BlogCard({ post, className, variant = "feed", priority = false }: BlogCardProps) {
  if (variant === "hero") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        prefetch={false}
        className={cn(
          "group grid overflow-hidden rounded-[14px] border border-white/8 bg-white/[0.02] transition-all duration-300 hover:border-white/16 hover:bg-white/[0.04] hover:shadow-card-hover",
          "lg:grid-cols-[1.05fr_minmax(0,1fr)]",
          className,
        )}
      >
        <NewsCoverImage
          title={post.title}
          imageUrl={post.thumbnail}
          uniqueId={post.slug}
          className="h-56 w-full lg:h-full"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          priority={priority}
        />
        <div className="flex flex-col justify-center p-6 lg:p-8">
          <p className="text-overline uppercase text-indigo-300/80">Lead Story</p>
          <h3 className="mt-2.5 text-2xl font-semibold leading-[1.2] tracking-tight text-white lg:text-[28px]">
            {post.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-body text-zinc-400">{post.excerpt}</p>
          <MetaRow post={post} />
          {post.sourceUrl ? (
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors group-hover:text-indigo-300">
              Original source
              <ArrowUpRight className="h-3 w-3" />
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
        prefetch={false}
        className={cn(
          "group grid grid-cols-[100px_minmax(0,1fr)] gap-3 overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-2.5 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.04]",
          className,
        )}
      >
        <NewsCoverImage
          title={post.title}
          imageUrl={post.thumbnail}
          uniqueId={post.slug}
          className="h-[80px] w-full rounded-lg"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="flex min-w-0 flex-col justify-center">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100 group-hover:text-white">{post.title}</h3>
          <MetaRow post={post} compact />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      prefetch={false}
      className={cn(
        "group grid gap-4 rounded-[14px] border border-white/8 bg-white/[0.02] p-3.5 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.04] hover:shadow-card sm:grid-cols-[200px_minmax(0,1fr)]",
        className,
      )}
    >
      <NewsCoverImage
        title={post.title}
        imageUrl={post.thumbnail}
        uniqueId={post.slug}
        className="h-32 w-full rounded-xl sm:h-full"
        imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-white">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{post.excerpt}</p>
        <MetaRow post={post} />
      </div>
    </Link>
  );
}
