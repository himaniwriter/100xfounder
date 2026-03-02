import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { countryToSlug } from "@/lib/founders/country-tier";
import { slugifySegment } from "@/lib/founders/hubs";
import { getCompanyNewsContext } from "@/lib/news/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type CompanyNewsPageProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: CompanyNewsPageProps): Promise<Metadata> {
  const context = await getCompanyNewsContext(params.slug, 80);
  if (!context) {
    return { title: "Company News Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/companies/${context.company.companySlug}/news`;
  return {
    title: `${context.company.companyName} News | 100Xfounder`,
    description: `Latest newsroom coverage mentioning ${context.company.companyName}, including funding, product, and leadership updates.`,
    alternates: { canonical },
  };
}

export default async function CompanyNewsPage({ params }: CompanyNewsPageProps) {
  const context = await getCompanyNewsContext(params.slug, 120);
  if (!context) {
    notFound();
  }

  const primaryFounder = context.companyFounders[0];
  const companyCountry = primaryFounder.country ?? "India";
  const countrySlug = countryToSlug(companyCountry);
  const industryLabel = primaryFounder.industry || "Startup";
  const industrySlug = slugifySegment(industryLabel);
  const stageLabel = primaryFounder.stage || "Growth";
  const stageSlug = slugifySegment(stageLabel);
  const headquarters = primaryFounder.headquarters?.trim() || companyCountry;
  const productSummary = primaryFounder.productSummary?.trim() || `${context.company.companyName} is building in ${industryLabel}.`;
  const foundersWithProfiles = context.companyFounders.filter((item) => Boolean(item.slug)).slice(0, 4);
  const hiringRoles = Array.from(
    new Set(
      context.companyFounders.flatMap((item) =>
        Array.isArray(item.hiringRoles) ? item.hiringRoles : [],
      ),
    ),
  ).slice(0, 6);
  const lastRound = primaryFounder.lastRound?.round?.trim();
  const lastRoundAmount = primaryFounder.lastRound?.amount?.trim();
  const totalFunding = primaryFounder.fundingTotalDisplay?.trim() || primaryFounder.fundingInfo?.trim() || "Undisclosed";

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/companies/${context.company.companySlug}/news`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.company.companyName} startup news`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Company", item: `${baseUrl}/company/${context.company.companySlug}` },
          { "@type": "ListItem", position: 3, name: "News", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Company News Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.company.companyName} News
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Newsroom coverage tied to {context.company.companyName} and related founders.
            Use this feed with company profile data for full context.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/company/${context.company.companySlug}`}
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              View Company Profile
            </Link>
            {context.companyFounders.slice(0, 2).map((founder) => (
              <Link
                key={founder.id}
                href={`/founders/${founder.slug}`}
                className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
              >
                {founder.founderName}
              </Link>
            ))}
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Company Intelligence Brief: {context.company.companyName}
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            This page helps readers follow <strong>{context.company.companyName}</strong> with clearer context than a single headline.
            The business is tracked in the <strong>{industryLabel}</strong> category, currently mapped to
            <strong> {stageLabel}</strong>, and operates from <strong>{headquarters}</strong>. The goal of this hub is to connect
            newsroom mentions, founder profiles, and category pages so you can quickly understand whether a development is a one-off
            event or part of a larger trend.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Current profile context suggests the company focus is: {productSummary}. Funding context available on this profile is
            <strong> {totalFunding}</strong>
            {lastRound ? (
              <>
                {", with the latest mapped round as "}
                <strong>{lastRound}</strong>
                {lastRoundAmount ? ` (${lastRoundAmount})` : ""}.
              </>
            ) : (
              "."
            )}
            {" "}
            For readers doing market research, this is useful because execution signals often appear first in category coverage and
            only later in direct company announcements.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Use this company-news page together with internal hub pages to compare trajectory against peers. Start from the
            <Link
              href={`/company/${context.company.companySlug}`}
              className="text-indigo-300 hover:text-indigo-200"
            >
              {" company profile"}
            </Link>
            , then open the
            <Link
              href={`/countries/${countrySlug}/news`}
              className="text-indigo-300 hover:text-indigo-200"
            >
              {" country news feed"}
            </Link>
            {" and "}
            <Link
              href={`/startups/industry/${industrySlug}`}
              className="text-indigo-300 hover:text-indigo-200"
            >
              {`${industryLabel} startup list`}
            </Link>
            . This sequence gives a practical view of demand, capital flow, and hiring movement around the same market segment.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Research Path</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>
                  Review
                  <Link href={`/company/${context.company.companySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {" company profile details"}
                  </Link>
                  {" for stage, sector, and funding baseline."}
                </li>
                <li>
                  Compare with
                  <Link href={`/industries/${industrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` ${industryLabel} industry coverage`}
                  </Link>
                  {" and peer entities in the same category."}
                </li>
                <li>
                  Track stage-level movement via
                  <Link href={`/funding-rounds/${stageSlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` ${stageLabel} funding coverage`}
                  </Link>
                  {" and "}
                  <Link href={`/startups/funding-round/${stageSlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {"startup round pages"}
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Founder & Execution Signals</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>
                  Founder context:
                  {" "}
                  {foundersWithProfiles.length > 0 ? (
                    foundersWithProfiles.map((founder, index) => (
                      <span key={founder.id}>
                        {index > 0 ? ", " : " "}
                        <Link href={`/founders/${founder.slug}`} className="text-indigo-300 hover:text-indigo-200">
                          {founder.founderName}
                        </Link>
                      </span>
                    ))
                  ) : (
                    "profile links will appear as entities are mapped."
                  )}
                </li>
                <li>
                  Geography context:
                  <Link href={`/countries/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` ${companyCountry} startup directory`}
                  </Link>
                  {" and "}
                  <Link href={`/countries/${countrySlug}/news`} className="text-indigo-300 hover:text-indigo-200">
                    {"country newsroom"}
                  </Link>
                  .
                </li>
                <li>
                  Hiring watch:
                  {hiringRoles.length > 0
                    ? ` active role clusters include ${hiringRoles.join(", ")}.`
                    : " no role cluster has been published yet, so monitor this hub for new operational updates."}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            {context.items.length > 0 ? (
              context.items.map((post, index) => (
                <BlogCard key={post.slug} post={post} variant={index === 0 ? "hero" : "feed"} />
              ))
            ) : (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6">
                <h3 className="text-base font-semibold text-white">No direct newsroom stories yet</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  We have not mapped a direct article to {context.company.companyName} in the newsroom feed yet. This usually means
                  recent mentions are spread across broader market stories rather than tagged to a single company page. You can still
                  build a strong picture by following related hub pages and then returning here for direct references.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                  <li>
                    Scan
                    <Link href={`/topics`} className="text-indigo-300 hover:text-indigo-200">
                      {" topic hubs"}
                    </Link>
                    {" for category-level movement."}
                  </li>
                  <li>
                    Check
                    <Link href={`/funding-rounds`} className="text-indigo-300 hover:text-indigo-200">
                      {" funding round coverage"}
                    </Link>
                    {" for capital and valuation signals."}
                  </li>
                  <li>
                    Compare peers on
                    <Link href={`/startups/industry/${industrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${industryLabel} startup pages`}
                    </Link>
                    {" and "}
                    <Link href={`/countries/${countrySlug}/news`} className="text-indigo-300 hover:text-indigo-200">
                      {`${companyCountry} market news`}
                    </Link>
                    .
                  </li>
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Companies</p>
              <div className="mt-3 space-y-2">
                {context.relatedCompanies.length > 0 ? (
                  context.relatedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/companies/${company.companySlug}/news`}
                      className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                    >
                      <p className="text-sm font-medium text-white">{company.companyName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{company.industry}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No related companies available yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Topics</p>
              <div className="mt-3 space-y-2">
                {context.relatedTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                  >
                    <p className="text-sm font-medium text-white">{topic.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{topic.count} stories</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
