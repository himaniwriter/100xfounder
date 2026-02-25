import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import {
  getStartupHubOverview,
  mapTopStartupsDirectoryQueryToPath,
} from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

type StartupsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toSearchParams(input: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();

  Object.entries(input || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry?.trim()) {
          params.append(key, entry.trim());
        }
      });
      return;
    }

    if (typeof value === "string" && value.trim()) {
      params.append(key, value.trim());
    }
  });

  return params;
}

export async function generateMetadata({ searchParams }: StartupsPageProps): Promise<Metadata> {
  const baseUrl = getSiteBaseUrl();
  const params = toSearchParams(searchParams);
  const mapped = mapTopStartupsDirectoryQueryToPath(params);
  const hasQuery = Array.from(params.keys()).length > 0;

  return {
    title: "Top Startups Directory | Industry, Location, Funding, Investors | 100Xfounder",
    description:
      "Explore top startups by industry, location, funding round, and investor with clean SEO-friendly taxonomy pages.",
    alternates: {
      canonical: mapped ? `${baseUrl}${mapped}` : `${baseUrl}/startups`,
    },
    robots: mapped
      ? {
          index: false,
          follow: true,
        }
      : hasQuery
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

export default async function StartupsPage({ searchParams }: StartupsPageProps) {
  const params = toSearchParams(searchParams);
  const mapped = mapTopStartupsDirectoryQueryToPath(params);

  if (mapped) {
    permanentRedirect(mapped);
  }

  const overview = await getStartupHubOverview();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startups SEO Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Top Startups by Category, City, Funding Round, and Investor
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Path-based startup taxonomy built for high-intent search. Explore startup lists across industries,
            headquarters, funding rounds, and investor-backed cohorts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {overview.totalStartups} companies indexed
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Last updated {new Date(overview.updatedAt).toLocaleDateString("en-US")}
            </span>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TaxonomyCard
            title="Industries"
            description="AI, FinTech, Cybersecurity, SaaS, Healthcare and more."
            href="/startups/industry"
            count={overview.industries.length}
          />
          <TaxonomyCard
            title="Locations"
            description="Top startup ecosystems from US and global startup hubs."
            href="/startups/location"
            count={overview.locations.length}
          />
          <TaxonomyCard
            title="Funding Rounds"
            description="Seed to Series E+ startup cohorts by latest round signals."
            href="/startups/funding-round"
            count={overview.fundingRounds.length}
          />
          <TaxonomyCard
            title="Investors"
            description="Investor-backed startup clusters, including Y Combinator cohorts."
            href="/startups/investor"
            count={overview.investors.length}
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <FeatureCard
            title="Startup Jobs"
            description="SEO-friendly startup job pages by location, role, title, and market."
            href="/startups/jobs"
          />
          <FeatureCard
            title="Salary & Equity"
            description="Compensation benchmark pages for startup hiring and offer decisions."
            href="/startups/salary-equity"
          />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <TaxonomyPreview
            title="Top Industry Pages"
            hrefPrefix="/startups/industry"
            items={overview.industries.slice(0, 10)}
          />
          <TaxonomyPreview
            title="Top Location Pages"
            hrefPrefix="/startups/location"
            items={overview.locations.slice(0, 10)}
          />
          <TaxonomyPreview
            title="Top Funding Round Pages"
            hrefPrefix="/startups/funding-round"
            items={overview.fundingRounds.slice(0, 10)}
          />
          <TaxonomyPreview
            title="Top Investor Pages"
            hrefPrefix="/startups/investor"
            items={overview.investors.slice(0, 10)}
          />
        </section>
      </section>

      <Footer />
    </main>
  );
}

type TaxonomyCardProps = {
  title: string;
  description: string;
  href: string;
  count: number;
};

function TaxonomyCard({ title, description, href, count }: TaxonomyCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px] transition-all hover:border-white/30 hover:shadow-[0_0_18px_rgba(99,102,241,0.2)]"
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.15em] text-indigo-300">{count} pages</p>
    </Link>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
};

function FeatureCard({ title, description, href }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px] transition-all hover:border-white/30 hover:shadow-[0_0_18px_rgba(99,102,241,0.2)]"
    >
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.15em] text-indigo-300">Open section</p>
    </Link>
  );
}

type TaxonomyPreviewProps = {
  title: string;
  hrefPrefix: string;
  items: Array<{ slug: string; label: string; count: number }>;
};

function TaxonomyPreview({ title, hrefPrefix, items }: TaxonomyPreviewProps) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
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
