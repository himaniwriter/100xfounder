import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { slugifySegment } from "@/lib/founders/hubs";
import { getCountryCoverage } from "@/lib/founders/store";
import { getCountryNewsContext } from "@/lib/news/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;
const HUB_STATIC_THRESHOLD = 15;
const STATIC_PARAMS_CAP = 5000;

type CountryNewsPageProps = {
  params: { slug: string };
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const coverage = await getCountryCoverage();
  return coverage
    .filter((country) => country.companyCount >= HUB_STATIC_THRESHOLD)
    .slice(0, STATIC_PARAMS_CAP)
    .map((country) => ({ slug: country.countrySlug }));
}

export async function generateMetadata({
  params,
}: CountryNewsPageProps): Promise<Metadata> {
  const context = await getCountryNewsContext(params.slug, 80);
  if (!context) {
    return { title: "Country News Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/countries/${context.countrySlug}/news`;
  return {
    title: `${context.country} Startup News | 100Xfounder`,
    description: `Latest startup stories linked to ${context.country} with source-attributed coverage and related founder/company intelligence.`,
    alternates: { canonical },
  };
}

export default async function CountryNewsPage({ params }: CountryNewsPageProps) {
  const context = await getCountryNewsContext(params.slug, 120);
  if (!context) {
    notFound();
  }

  const countrySlug = context.countrySlug;
  const primaryTopic = context.relatedTopics[0];
  const secondaryTopic = context.relatedTopics[1];
  const primaryTopicSlug = primaryTopic?.slug;
  const primaryTopicLabel = primaryTopic?.label ?? "startup operations";
  const secondaryTopicSlug = secondaryTopic?.slug;
  const secondaryTopicLabel = secondaryTopic?.label ?? "funding movement";
  const primaryTopicCategorySlug = slugifySegment(primaryTopicLabel);
  const secondaryTopicCategorySlug = slugifySegment(secondaryTopicLabel);
  const tierLabel = context.tier.replace("_", " ");

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/countries/${context.countrySlug}/news`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.country} startup news`,
        description: `Newsroom stories for ${context.country}.`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Countries", item: `${baseUrl}/countries` },
          {
            "@type": "ListItem",
            position: 3,
            name: context.country,
            item: `${baseUrl}/countries/${context.countrySlug}`,
          },
          { "@type": "ListItem", position: 4, name: "News", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Country News Hub • {context.tier.replace("_", " ")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.country} Startup News
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Country-focused newsroom feed for {context.country}. Pair this with directory and
            funding data to evaluate ecosystem momentum.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/countries/${context.countrySlug}`}
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              View Country Directory
            </Link>
            <Link
              href={`/founders?country=${encodeURIComponent(context.country)}`}
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Hiring Snapshot
            </Link>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Market Brief: {context.country} Startup Coverage
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            This hub is designed for readers who want a clear view of startup activity in <strong>{context.country}</strong>
            without jumping across multiple sites. The page combines country-specific reporting with internal links to directories,
            topic clusters, and funding surfaces. In practical terms, this means you can move from a headline to comparable companies,
            then to category-level movement, in one research flow.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            {context.country} is currently mapped as <strong>{tierLabel}</strong> coverage in the platform. We use this tier context
            to prioritize stories around operating signals, founder execution, and capital deployment. If your objective is deal
            discovery, market expansion research, or competitive monitoring, this page works best when paired with the
            <Link href={`/countries/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
              {" country directory"}
            </Link>
            {" and "}
            <Link href="/founders" className="text-indigo-300 hover:text-indigo-200">
              {"founder profiles"}
            </Link>
            {" for deeper entity-level context."}
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Current topic momentum in this coverage set includes <strong>{primaryTopicLabel}</strong>
            {secondaryTopic ? (
              <>
                {" and "}
                <strong>{secondaryTopicLabel}</strong>
              </>
            ) : null}
            . You can use these signals to shortlist which segments are attracting attention and where to spend research time next.
            This approach is faster than reading isolated updates, because each article here can be connected to related market hubs.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Suggested Research Flow</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>
                  Start with the
                  <Link href={`/countries/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` ${context.country} directory`}
                  </Link>
                  {" to identify active companies and founders."}
                </li>
                <li>
                  Compare with
                  <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
                    {" funding-round coverage"}
                  </Link>
                  {" to map capital flow by stage."}
                </li>
                <li>
                  Expand to
                  <Link href={`/startups/location/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` startups by location (${context.country})`}
                  </Link>
                  {" and cross-check market peers."}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Topic Paths</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>
                  Primary topic:
                  {primaryTopicSlug ? (
                    <Link href={`/topics/${primaryTopicSlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${primaryTopicLabel}`}
                    </Link>
                  ) : (
                    ` ${primaryTopicLabel}`
                  )}
                </li>
                <li>
                  Category view:
                  <Link href={`/startups/industry/${primaryTopicCategorySlug}`} className="text-indigo-300 hover:text-indigo-200">
                    {` startups in ${primaryTopicLabel}`}
                  </Link>
                </li>
                {secondaryTopicSlug ? (
                  <li>
                    Secondary topic:
                    <Link href={`/topics/${secondaryTopicSlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${secondaryTopicLabel}`}
                    </Link>
                    {" and related "}
                    <Link href={`/startups/industry/${secondaryTopicCategorySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {"startup pages"}
                    </Link>
                    .
                  </li>
                ) : null}
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
                <h3 className="text-base font-semibold text-white">No direct country stories mapped yet</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">
                  We do not have a direct story mapped to this country feed right now. That does not mean the market is inactive.
                  In many cases, early signals appear first in topic hubs, company pages, or stage-based funding updates before they
                  are clustered into a country timeline.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                  <li>
                    Check
                    <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
                      {" latest newsroom stories"}
                    </Link>
                    {" and filter by relevant topics."}
                  </li>
                  <li>
                    Review
                    <Link href="/signals" className="text-indigo-300 hover:text-indigo-200">
                      {" market pulse signals"}
                    </Link>
                    {" for funding and hiring movement."}
                  </li>
                  <li>
                    Explore
                    <Link href={`/countries/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${context.country} startup profiles`}
                    </Link>
                    {" for company-level context while coverage builds."}
                  </li>
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
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
