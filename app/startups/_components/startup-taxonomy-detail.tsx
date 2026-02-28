import Link from "next/link";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { FounderCard } from "@/components/founder-card";
import type {
  StartupListContext,
  StartupTaxonomyOption,
} from "@/lib/startups/catalog";

type StartupTaxonomyDetailProps = {
  context: StartupListContext;
  basePath: string;
  related: StartupTaxonomyOption[];
};

export function StartupTaxonomyDetail({
  context,
  basePath,
  related,
}: StartupTaxonomyDetailProps) {
  const anchorItem = context.items[0];
  const pageSuffix = context.page > 1 ? ` (Page ${context.page})` : "";

  const previousHref =
    context.page > 1
      ? context.page === 2
        ? basePath
        : `${basePath}?page=${context.page - 1}`
      : null;

  const nextHref =
    context.page < context.totalPages ? `${basePath}?page=${context.page + 1}` : null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startup Directory</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {context.label} Startups{pageSuffix}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{context.description}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            {context.totalCount} companies indexed
          </span>
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            Funding-first ranking
          </span>
          {!context.shouldIndex ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-200">
              Low-volume page (noindex)
            </span>
          ) : null}
        </div>
      </header>

      {context.items.length > 0 ? (
        <div className="mt-8 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {context.items.map((item) => (
            <FounderCard key={`${context.slug}-${item.id}`} founder={item} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-sm text-zinc-400 backdrop-blur-[40px]">
          No startup profiles matched this taxonomy yet.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Page {context.page} of {context.totalPages}
        </div>
        <div className="flex items-center gap-2">
          {previousHref ? (
            <Link
              href={previousHref}
              className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Previous
            </Link>
          ) : null}
          {nextHref ? (
            <Link
              href={nextHref}
              className="rounded-md border border-white/15 bg-white/[0.03] px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Related Startup Pages</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`${basePath.split("/").slice(0, -1).join("/")}/${item.slug}`}
                className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <PillarCrosslinks
        context={{
          country: anchorItem?.country,
          industry: anchorItem?.industry,
          stage: anchorItem?.stage,
          fundingRound: anchorItem?.lastRound?.round,
          companySlug: anchorItem?.companySlug,
        }}
        includeGlobal
        maxLinks={8}
        title="Connected Pillar Routes"
        description="Continue discovery through country, industry, stage, funding, and newsroom hubs."
        className="mt-8"
      />
    </section>
  );
}
