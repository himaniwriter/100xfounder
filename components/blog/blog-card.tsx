import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/lib/blog/types";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
};

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md transition-all hover:border-white/20",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <img
        src={post.thumbnail}
        alt={post.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-100">
            {post.category}
          </span>
          <span className="text-xs text-zinc-300">{post.readingTime}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-white">
          {post.title}
        </h3>
      </div>
    </Link>
  );
}
