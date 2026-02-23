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
            and entity-level context to reduce research time.
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
              No topic hubs available yet. Publish newsroom posts with topic metadata to populate this page.
            </div>
          )}
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
