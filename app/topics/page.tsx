import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { getTopicSummaries } from "@/lib/news/hubs";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Startup News Topics | 100Xfounder Newsroom",
  description:
    "Browse startup newsroom coverage by topic with source-attributed stories across funding, founders, hiring, and market shifts.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/topics`,
  },
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default async function TopicsIndexPage() {
  const topics = await getTopicSummaries(120);
  const baseUrl = getSiteBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/topics#webpage`,
        url: `${baseUrl}/topics`,
        name: "Startup news topics",
        description: "Topic index for startup coverage across India and the US.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Topics", item: `${baseUrl}/topics` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">News Hubs</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Startup Topic Hubs
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Explore coverage clusters by topic. Each hub groups related stories, source links,
            and entity-level context to reduce research time. Instead of reading isolated updates,
            you can move from a topic feed to founder pages, company profiles, and funding-stage
            summaries in a single research path.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="rounded-xl border border-white/15 bg-white/[0.03] p-4 transition-colors hover:border-white/30"
              >
                <p className="text-base font-medium text-white">{topic.label}</p>
                <p className="mt-2 text-xs text-zinc-400">{topic.count} stories indexed</p>
                <p className="mt-1 text-xs text-zinc-500">Updated: {formatDate(topic.lastPublishedAt)}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6 text-sm text-zinc-400 sm:col-span-2 lg:col-span-3">
              No topic hubs are available yet. As newsroom stories are published with topic metadata,
              this page automatically groups coverage into structured clusters for easier market tracking.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            How to use topic hubs for faster startup research
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Topic pages are built to answer a practical question: what changed in this startup segment,
            and which companies or founders are most affected? Start by reading the latest topic stories,
            then cross-check related market pages to confirm whether the signal is local, stage-specific,
            or part of a wider category trend.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            For deeper analysis, combine this page with the
            <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
              {" newsroom feed"}
            </Link>
            , then compare against
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding round hubs"}
            </Link>
            {" and "}
            <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
              {"country coverage"}
            </Link>
            . This creates a clear chain from article-level updates to entity-level profiles.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Research path</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>
                  Read topic stories, then open
                  <Link href="/signals" className="text-indigo-300 hover:text-indigo-200">
                    {" market pulse signals"}
                  </Link>
                  {" for funding and hiring movement."}
                </li>
                <li>
                  Move to
                  <Link href="/startups" className="text-indigo-300 hover:text-indigo-200">
                    {" startup directory pages"}
                  </Link>
                  {" to compare companies in the same market."}
                </li>
                <li>
                  Track contributor context from
                  <Link href="/authors" className="text-indigo-300 hover:text-indigo-200">
                    {" author profiles"}
                  </Link>
                  {" for consistency and coverage depth."}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Why this helps</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                <li>Reduces duplicate reading across similar stories and source outlets.</li>
                <li>Improves decision speed when evaluating sectors, founders, and funding momentum.</li>
                <li>Keeps internal links structured so discovery remains fast across related hubs.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Quick Links</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Newsroom Home
            </Link>
            <Link
              href="/authors"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Author Profiles
            </Link>
            <Link
              href="/news-sitemap.xml"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              News Sitemap
            </Link>
          </div>
        </section>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
