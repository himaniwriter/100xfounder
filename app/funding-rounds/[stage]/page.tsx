import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getFundingRoundOptions, getFundingStageNewsContext } from "@/lib/news/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;
const HUB_STATIC_THRESHOLD = 15;
const STATIC_PARAMS_CAP = 5000;

type FundingStagePageProps = {
  params: { stage: string };
};

export async function generateStaticParams(): Promise<Array<{ stage: string }>> {
  const options = await getFundingRoundOptions(STATIC_PARAMS_CAP);
  return options
    .filter((option) => option.count >= HUB_STATIC_THRESHOLD)
    .slice(0, STATIC_PARAMS_CAP)
    .map((option) => ({ stage: option.slug }));
}

export async function generateMetadata({
  params,
}: FundingStagePageProps): Promise<Metadata> {
  const context = await getFundingStageNewsContext(params.stage, 80);
  if (!context) {
    return { title: "Funding Stage Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/funding-rounds/${context.slug}`;

  return {
    title: `${context.label} Startup News | 100Xfounder`,
    description: `Latest ${context.label.toLowerCase()} startup coverage with source-attributed analysis and related topic links.`,
    alternates: { canonical },
  };
}

export default async function FundingStagePage({ params }: FundingStagePageProps) {
  const context = await getFundingStageNewsContext(params.stage, 120);
  if (!context) {
    notFound();
  }

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/funding-rounds/${context.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.label} funding round news`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Funding Rounds", item: `${baseUrl}/funding-rounds` },
          { "@type": "ListItem", position: 3, name: context.label, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <Link href="/funding-rounds" className="text-xs text-zinc-400 hover:text-zinc-200">
            ← Back to funding rounds
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.label} Startup News
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Stage-specific newsroom feed for {context.label} activity, including funding updates,
            key company moves, and related founder context.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {context.label} intelligence brief
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            This stage page is built for readers tracking how startups behave under a similar funding profile.
            Stage-level grouping makes it easier to compare execution quality, hiring strategy, and product depth
            without mixing early and late capital cycles in one list.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Use this feed together with
            <Link href={`/startups/funding-round/${context.slug}`} className="text-indigo-300 hover:text-indigo-200">
              {" startup cohort pages"}
            </Link>
            {" and "}
            <Link href="/stages" className="text-indigo-300 hover:text-indigo-200">
              {"stage directories"}
            </Link>
            . Then validate story-level trends against
            <Link href="/topics" className="text-indigo-300 hover:text-indigo-200">
              {" topic hubs"}
            </Link>
            {" and "}
            <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
              {"newsroom updates"}
            </Link>
            .
          </p>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            {context.items.length > 0 ? (
              context.items.map((post, index) => (
                <BlogCard key={post.slug} post={post} variant={index === 0 ? "hero" : "feed"} />
              ))
            ) : (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6 text-sm text-zinc-300">
                <h3 className="text-base font-semibold text-white">No direct stories indexed for this stage yet</h3>
                <p className="mt-3 leading-7">
                  Coverage for this funding stage is currently sparse. This usually happens when recent reporting is tagged
                  to broader market topics instead of a specific stage page.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5">
                  <li>
                    Review
                    <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
                      {" all funding hubs"}
                    </Link>
                    {" for adjacent stage activity."}
                  </li>
                  <li>
                    Open
                    <Link href="/topics" className="text-indigo-300 hover:text-indigo-200">
                      {" topic pages"}
                    </Link>
                    {" to find category-level capital signals."}
                  </li>
                  <li>
                    Compare with
                    <Link href={`/startups/funding-round/${context.slug}`} className="text-indigo-300 hover:text-indigo-200">
                      {" startup listings for this round"}
                    </Link>
                    .
                  </li>
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Stages</p>
              <div className="mt-3 space-y-2">
                {context.relatedStages.map((stage) => (
                  <Link
                    key={stage.slug}
                    href={`/funding-rounds/${stage.slug}`}
                    className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                  >
                    <p className="text-sm font-medium text-white">{stage.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{stage.count} companies tracked</p>
                  </Link>
                ))}
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
