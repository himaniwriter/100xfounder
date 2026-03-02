import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { BlogCard } from "@/components/blog/blog-card";
import { NewsletterSubscribeBox } from "@/components/blog/newsletter-subscribe-box";
import { getBlogHomeSections } from "@/lib/blog/store";
import { normalizeQueryValues, resolveQueryIndexability } from "@/lib/seo/indexability";
import { getSiteBaseUrl } from "@/lib/sitemap";

type BlogHomePageProps = {
  searchParams?: {
    category?: string | string[];
  };
};

export async function generateMetadata({
  searchParams,
}: BlogHomePageProps): Promise<Metadata> {
  const categoryValues = normalizeQueryValues(searchParams?.category);
  const decision = resolveQueryIndexability("/blog", {
    category: categoryValues,
  });
  const baseUrl = getSiteBaseUrl();

  return {
    title: "Startup News & Funding Desk | 100Xfounder Newsroom",
    description:
      "Daily startup intelligence from India and the US: rewritten funding updates, market signals, and founder moves with source attribution.",
    alternates: {
      canonical: `${baseUrl}${decision.canonicalPath}`,
    },
    robots: decision.robots,
  };
}

export default async function BlogHomePage({ searchParams }: BlogHomePageProps) {
  const { posts } = await getBlogHomeSections();
  const categoryValues = normalizeQueryValues(searchParams?.category);
  const activeCategory = categoryValues[0];
  const visiblePosts = categoryValues.length > 0
    ? posts.filter((post) =>
        categoryValues.some(
          (category) => post.category.toLowerCase() === category.toLowerCase(),
        ),
      )
    : posts;
  const featured = visiblePosts.find((post) => post.isFeatured) ?? visiblePosts[0] ?? null;
  const contextualSeed = featured ?? visiblePosts[0] ?? null;
  const trending = visiblePosts
    .filter((post) => post.isTrending && post.slug !== featured?.slug)
    .slice(0, 3);
  const latestFeed = visiblePosts.filter((post) => post.slug !== featured?.slug).slice(0, 9);
  const categories = Array.from(new Set(posts.map((post) => post.category))).slice(0, 8);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <span className="shrink-0 text-xs uppercase tracking-[0.22em] text-zinc-500">Newsroom</span>
          <Link
            href="/blog"
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
              activeCategory
                ? "border-white/15 bg-white/[0.03] text-zinc-300 hover:border-white/25 hover:text-white"
                : "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/blog?category=${encodeURIComponent(category)}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                categoryValues.some(
                  (active) => active.toLowerCase() === category.toLowerCase(),
                )
                  ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                  : "border-white/15 bg-white/[0.03] text-zinc-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-6 lg:px-8">
        <div>
          <header className="mb-6">
            <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">100Xfounder News Desk</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              India & US Startup Funding Coverage
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400 sm:text-base">
              Fast, source-attributed rewrites of high-signal startup stories. Read the summary here, then jump to the original
              reporting when needed.
            </p>
          </header>

          <PillarCrosslinks
            context={{
              topicSlug: contextualSeed?.topicSlug,
            }}
            includeGlobal
            maxLinks={8}
            title="Pillar Hubs"
            description="Move from newsroom stories to connected startup, funding, country, and category routes."
            className="mb-6"
          />

          <section className="mb-6 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">How to use this newsroom for decisions</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              This newsroom is structured for fast research. Read a headline summary here, verify the original source,
              and then move into related internal pages for broader context. That sequence helps reduce blind spots
              when you are tracking startups, founders, and funding shifts across India and the US.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              For a complete view, combine stories with
              <Link href="/topics" className="text-indigo-300 hover:text-indigo-200">
                {" topic hubs"}
              </Link>
              , 
              <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
                {" funding round pages"}
              </Link>
              , 
              <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
                {" country routes"}
              </Link>
              , and the
              <Link href="/startups" className="text-indigo-300 hover:text-indigo-200">
                {" startup directory"}
              </Link>
              . This keeps coverage contextual instead of isolated.
            </p>
          </section>

          {featured ? <BlogCard post={featured} variant="hero" priority /> : null}

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Latest Coverage</h2>
              <Link href="https://entrackr.com/" target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200">
                View source site
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {latestFeed.map((post) => (
                <BlogCard key={post.slug} post={post} variant="feed" />
              ))}
              {latestFeed.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-400">
                  No posts found for this category.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="relative space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div>
            <div className="rounded-2xl border border-indigo-400/35 bg-[#0a0f22] p-4 shadow-[0_14px_42px_rgba(2,6,23,0.62)]">
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-200">Get Featured</p>
              <p className="mt-2 text-sm text-zinc-200">
                Founder story to publish? Use our feature funnel or guest-post order flow.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/get-featured"
                  className="rounded-md border border-indigo-300/40 bg-indigo-400/10 px-2.5 py-1.5 text-xs text-indigo-100 transition-colors hover:bg-indigo-400/20"
                >
                  Get Featured
                </Link>
                <Link
                  href="/guest-post-marketplace"
                  className="rounded-md border border-white/20 bg-black/30 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/35"
                >
                  Guest Post Plans
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <h2 className="text-xs uppercase tracking-[0.22em] text-zinc-500">Trending on Desk</h2>
              <div className="mt-3 space-y-3">
                {trending.map((post) => (
                  <BlogCard key={post.slug} post={post} variant="stack" />
                ))}
              </div>
            </div>

            <NewsletterSubscribeBox topic="startup-news" />

            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Coverage Policy</p>
              <p className="mt-2 text-sm text-zinc-400">
                We publish rewritten summaries with source links, and do not mirror full articles from publishers.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
