import Link from "next/link";
import type { InternalLinkNode } from "@/lib/seo/internal-link-graph";

type ContextualLinkClusterProps = {
  links: InternalLinkNode[];
  title?: string;
  description?: string;
  className?: string;
};

export function ContextualLinkCluster({
  links,
  title = "Explore Related Hubs",
  description = "Navigate high-intent category pages connected to this context.",
  className,
}: ContextualLinkClusterProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section
      className={["py-4", className ?? ""].join(" ").trim()}
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <div className="mt-6 grid gap-x-12 gap-y-1 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center justify-between border-b border-white/[0.06] py-3.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/[0.15] hover:text-white"
          >
            <span className="truncate pr-4">{link.label}</span>
            <span className="text-zinc-600 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
