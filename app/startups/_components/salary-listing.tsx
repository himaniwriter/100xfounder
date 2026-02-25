import Link from "next/link";
import type {
  SalaryEquityFacet,
  SalaryFacetContext,
} from "@/lib/salary-equity/store";

type SalaryOverviewProps = {
  totalCount: number;
  updatedAt: string | null;
  byLocation: SalaryEquityFacet[];
  byRole: SalaryEquityFacet[];
  byStage: SalaryEquityFacet[];
};

export function SalaryOverview({
  totalCount,
  updatedAt,
  byLocation,
  byRole,
  byStage,
}: SalaryOverviewProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startup Salary & Equity</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Salary and Equity Benchmarks for Startup Teams
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Navigate role, stage, and location benchmarks with crawlable compensation pages.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            {totalCount} benchmark records
          </span>
          {updatedAt ? (
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Updated {new Date(updatedAt).toLocaleDateString("en-US")}
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <FacetCard title="By Location" hrefPrefix="/startups/salary-equity/location" options={byLocation.slice(0, 12)} />
        <FacetCard title="By Role" hrefPrefix="/startups/salary-equity/role" options={byRole.slice(0, 12)} />
        <FacetCard title="By Stage" hrefPrefix="/startups/salary-equity/stage" options={byStage.slice(0, 12)} />
      </div>
    </section>
  );
}

type SalaryFacetPageProps = {
  context: SalaryFacetContext;
  basePath: string;
  related: SalaryEquityFacet[];
};

export function SalaryFacetPage({
  context,
  basePath,
  related,
}: SalaryFacetPageProps) {
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
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Salary & Equity Taxonomy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {context.label} Salary and Equity Data
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
          Benchmark startup compensation across this category.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
            {context.totalCount} records
          </span>
          {!context.shouldIndex ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-200">
              Low-volume page (noindex)
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/25">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-400">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Base Salary</th>
              <th className="px-4 py-3">Equity</th>
            </tr>
          </thead>
          <tbody>
            {context.entries.map((entry) => (
              <tr key={entry.id} className="border-b border-white/10 last:border-0">
                <td className="px-4 py-3 text-zinc-100">{entry.role}</td>
                <td className="px-4 py-3 text-zinc-300">{entry.level || "-"}</td>
                <td className="px-4 py-3 text-zinc-300">{entry.location || entry.country || "-"}</td>
                <td className="px-4 py-3 text-zinc-300">{entry.stage || "-"}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {entry.baseMin || entry.baseMax
                    ? `${entry.currency} ${entry.baseMin?.toLocaleString("en-US") || 0} - ${entry.baseMax?.toLocaleString("en-US") || 0}`
                    : "Undisclosed"}
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {typeof entry.equityMinBps === "number" || typeof entry.equityMaxBps === "number"
                    ? `${entry.equityMinBps ?? 0}-${entry.equityMaxBps ?? 0} bps`
                    : "Undisclosed"}
                </td>
              </tr>
            ))}
            {context.entries.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-zinc-400" colSpan={6}>
                  No compensation records found for this facet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Related Compensation Pages</h2>
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
    </section>
  );
}

type FacetCardProps = {
  title: string;
  hrefPrefix: string;
  options: SalaryEquityFacet[];
};

function FacetCard({ title, hrefPrefix, options }: FacetCardProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">{title}</h2>
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
