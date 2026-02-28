import Link from "next/link";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import type {
  JobFacetContext,
  JobFacetOption,
  JobPostingRecord,
} from "@/lib/startups/catalog";

type JobsOverviewProps = {
  jobs: JobPostingRecord[];
  byLocation: JobFacetOption[];
  byRole: JobFacetOption[];
  byMarket: JobFacetOption[];
  totalCount: number;
  updatedAt: string | null;
};

export function JobsOverview({
  jobs,
  byLocation,
  byRole,
  byMarket,
  totalCount,
  updatedAt,
}: JobsOverviewProps) {
  const latest = jobs.slice(0, 18);
  const anchorJob = latest[0];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startup Jobs</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Startup Jobs by Location, Role, and Market
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Discover high-intent startup hiring pages with SEO-friendly taxonomy paths.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            {totalCount} live jobs indexed
          </span>
          {updatedAt ? (
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Updated {new Date(updatedAt).toLocaleDateString("en-US")}
            </span>
          ) : null}
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <FacetBlock title="Location" hrefPrefix="/startups/jobs/location" options={byLocation.slice(0, 12)} />
        <FacetBlock title="Role" hrefPrefix="/startups/jobs/role" options={byRole.slice(0, 12)} />
        <FacetBlock title="Market" hrefPrefix="/startups/jobs/market" options={byMarket.slice(0, 12)} />
      </section>

      <PillarCrosslinks
        context={{
          country: anchorJob?.country,
          industry: anchorJob?.industry,
          topic: "startup jobs",
        }}
        includeGlobal
        maxLinks={8}
        title="Related Jobs and Market Hubs"
        description="Open connected startup, industry, country, and newsroom pages from this jobs surface."
        className="mt-8"
      />

      <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Latest Startup Jobs</h2>
        <div className="mt-4 space-y-3">
          {latest.map((job) => (
            <article key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{job.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{job.companyName}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                    <span>{job.location || job.country || "Remote"}</span>
                    {job.industry ? <span>• {job.industry}</span> : null}
                    {job.workMode ? <span>• {job.workMode}</span> : null}
                  </div>
                </div>
                <Link
                  href={job.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25"
                >
                  Apply
                </Link>
              </div>
            </article>
          ))}

          {latest.length === 0 ? (
            <p className="text-sm text-zinc-400">No published jobs available yet.</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}

type JobsFacetPageProps = {
  context: JobFacetContext;
  basePath: string;
  related: JobFacetOption[];
};

export function JobsFacetPage({ context, basePath, related }: JobsFacetPageProps) {
  const anchorJob = context.jobs[0];
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
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startup Jobs Taxonomy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Startup Jobs: {context.label}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Explore jobs in the {context.label} cluster with clean path-based URLs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            {context.totalCount} jobs indexed
          </span>
          {!context.shouldIndex ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-200">
              Low-volume page (noindex)
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-8 space-y-3">
        {context.jobs.map((job) => (
          <article key={job.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{job.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{job.companyName}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>{job.location || job.country || "Remote"}</span>
                  {job.industry ? <span>• {job.industry}</span> : null}
                  {job.experienceLevel ? <span>• {job.experienceLevel}</span> : null}
                </div>
              </div>
              <Link
                href={job.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25"
              >
                Apply
              </Link>
            </div>
          </article>
        ))}

        {context.jobs.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No jobs found for this facet.
          </p>
        ) : null}
      </div>

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
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Related Job Pages</h2>
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
          country: anchorJob?.country,
          industry: anchorJob?.industry,
          topic: "startup jobs",
        }}
        includeGlobal
        maxLinks={8}
        title="Connected Discovery Routes"
        description="Continue from job facets into startup taxonomy, country hubs, and newsroom clusters."
        className="mt-8"
      />
    </section>
  );
}

type FacetBlockProps = {
  title: string;
  hrefPrefix: string;
  options: JobFacetOption[];
};

function FacetBlock({ title, hrefPrefix, options }: FacetBlockProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
      <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-300">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((item) => (
          <Link
            key={item.slug}
            href={`${hrefPrefix}/${item.slug}`}
            className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            {item.label} ({item.count})
          </Link>
        ))}
      </div>
    </div>
  );
}
