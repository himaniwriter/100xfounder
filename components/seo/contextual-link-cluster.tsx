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
      className={[
        "rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
