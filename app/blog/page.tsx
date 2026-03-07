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

type ThemeCategoryKey =
  | "startup"
  | "trending-news"
  | "funding-news"
  | "acquisition-news"
  | "opinion"
  | "founder-interviews";

const THEME_CATEGORIES: Array<{ key: ThemeCategoryKey; label: string }> = [
  { key: "startup", label: "Startup" },
  { key: "trending-news", label: "Trending News" },
  { key: "funding-news", label: "Funding News" },
  { key: "acquisition-news", label: "Accquisition News" },
  { key: "opinion", label: "Opinion" },
  { key: "founder-interviews", label: "Founder Interviews" },
];

function normalizeCategorySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseThemeCategoryKey(value: string | undefined): ThemeCategoryKey | null {
  if (!value) {
    return null;
  }

  const slug = normalizeCategorySlug(value);
  if (slug === "accquisition-news") {
    return "acquisition-news";
  }

  return THEME_CATEGORIES.some((item) => item.key === slug) ? (slug as ThemeCategoryKey) : null;
}

function resolvePostThemeTags(post: {
  category: string;
  title: string;
  excerpt: string;
  articleType?: string;
  isTrending?: boolean;
}): Set<ThemeCategoryKey> {
  const tags = new Set<ThemeCategoryKey>();
  const context = `${post.category} ${post.title} ${post.excerpt} ${post.articleType ?? ""}`.toLowerCase();

  if (post.isTrending || /\btrending\b|\bbreaking\b|\btop story\b/.test(context)) {
    tags.add("trending-news");
  }

  if (
    /\bfunding\b|\bseries\s+[a-z]\b|\bseed\b|\bpre-seed\b|\braise[sd]?\b|\bvaluation\b|\binvestor\b|\bcapital\b|\bipo\b|\bvc\b|\bround\b/.test(
      context,
    )
  ) {
    tags.add("funding-news");
  }

  if (/\bacquisition\b|\bacquire[sd]?\b|\bmerger\b|\bm&a\b|\bbuyout\b|\btakeover\b/.test(context)) {
    tags.add("acquisition-news");
  }

  if (
    /\bopinion\b|\banalysis\b|\beditorial\b|\bviewpoint\b|\binsight\b|\bdeep dive\b/.test(context) ||
    (post.articleType ?? "").toLowerCase() === "analysis"
  ) {
    tags.add("opinion");
  }

  if (/\binterview\b|\bq&a\b|\bfounder interview\b|\bfounder story\b|\bconversation with\b/.test(context)) {
    tags.add("founder-interviews");
  }

  if (
    tags.size === 0 ||
    /\bstartup\b|\bfounder\b|\bcompany\b|\becosystem\b|\bmarket\b|\bscale\b/.test(context)
  ) {
    tags.add("startup");
  }

  return tags;
}

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
  const selectedThemeCategory = parseThemeCategoryKey(categoryValues[0]);
  const selectedRawCategory = selectedThemeCategory ? null : categoryValues[0];
  const postThemeTags = new Map(
    posts.map((post) => [post.slug, resolvePostThemeTags(post)]),
  );

  const visiblePosts = selectedThemeCategory
    ? posts.filter((post) => postThemeTags.get(post.slug)?.has(selectedThemeCategory))
    : selectedRawCategory
      ? posts.filter((post) => post.category.toLowerCase() === selectedRawCategory.toLowerCase())
      : posts;
  const featured = visiblePosts.find((post) => post.isFeatured) ?? visiblePosts[0] ?? null;
  const contextualSeed = featured ?? visiblePosts[0] ?? null;
  const trending = visiblePosts
    .filter((post) => post.isTrending && post.slug !== featured?.slug)
    .slice(0, 5);
  const latestFeed = visiblePosts.filter((post) => post.slug !== featured?.slug).slice(0, 12);
  const showcasePool = visiblePosts.filter((post) => post.slug !== featured?.slug);
  const quickReads = showcasePool.slice(0, 2);
  const leadCompanions = showcasePool.slice(2, 4);
  const topStories = (trending.length > 0 ? trending : showcasePool).slice(0, 5);
  const renderedSections = (selectedThemeCategory
    ? THEME_CATEGORIES.filter((item) => item.key === selectedThemeCategory)
    : THEME_CATEGORIES
  )
    .map((item) => ({
      ...item,
      posts: posts.filter((post) => postThemeTags.get(post.slug)?.has(item.key)).slice(0, 5),
    }))
    .filter((item) => item.posts.length > 0);

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100">
      <Navbar />

      <section className="border-b border-white/6 bg-white/[0.02]">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2.5 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <span className="shrink-0 text-overline uppercase text-zinc-600">Newsroom</span>
          <Link
            href="/blog"
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${selectedThemeCategory || selectedRawCategory
                ? "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                : "border-indigo-400/40 bg-indigo-500/10 text-indigo-200"
              }`}
          >
            All
          </Link>
          {THEME_CATEGORIES.map((category) => (
            <Link
              key={category.key}
              href={`/blog?category=${encodeURIComponent(category.label)}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors duration-150 ${selectedThemeCategory === category.key
                  ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                }`}
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-6 lg:px-8">
        <div>
          <header className="mb-8">
            <p className="text-overline uppercase text-zinc-500">100Xfounder News Desk</p>
            <h1 className="mt-2.5 text-heading-1 text-white">
              India & US Startup Funding Coverage
            </h1>
            <p className="mt-2 max-w-2xl text-body text-zinc-500">
              Fast, source-attributed rewrites of high-signal startup stories. Read the summary here, then jump to the original
              reporting when needed.
            </p>
          </header>

          <section className="mb-8 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Quick Reads</p>
              {quickReads.length > 0 ? (
                quickReads.map((post) => <BlogCard key={post.slug} post={post} variant="stack" />)
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
                  No quick stories available right now.
                </div>
              )}
            </div>

            <div className="space-y-3">
              {featured ? <BlogCard post={featured} variant="hero" priority /> : null}
              {leadCompanions.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {leadCompanions.map((post) => (
                    <BlogCard key={post.slug} post={post} variant="stack" />
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-300">
                News by Category
              </h2>
              <span className="text-xs text-zinc-500">Startup, funding, acquisitions, opinions, and interviews</span>
            </div>

            {renderedSections.map((section) => {
              const [lead, ...stack] = section.posts;

              return (
                <section
                  key={section.key}
                  className="rounded-[14px] border border-white/8 bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{section.label}</h3>
                    <Link
                      href={`/blog?category=${encodeURIComponent(section.label)}`}
                      className="text-xs text-indigo-300 transition-colors hover:text-indigo-200"
                    >
                      View all {section.label.toLowerCase()} →
                    </Link>
                  </div>

                  {lead ? (
                    <BlogCard post={lead} variant="feed" />
                  ) : null}

                  {stack.length > 0 ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {stack.map((post) => (
                        <BlogCard key={post.slug} post={post} variant="stack" />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Latest Coverage</h2>
              <Link
                href="https://entrackr.com/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
              >
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

          <PillarCrosslinks
            context={{
              topicSlug: contextualSeed?.topicSlug,
            }}
            includeGlobal
            maxLinks={8}
            title="Pillar Hubs"
            description="Move from newsroom stories to connected startup, funding, country, and category routes."
            className="mt-8"
          />

          <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
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
        </div>

        <aside className="relative space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div>
            <section className="rounded-[14px] border border-indigo-400/20 bg-gradient-to-b from-indigo-500/8 to-transparent p-4 shadow-elevated">
              <p className="text-overline uppercase text-indigo-200">Get Featured</p>
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
            </section>
          </div>

          <div className="space-y-5">
            <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-4">
              <h2 className="text-overline uppercase text-zinc-500">Trending on Desk</h2>
              <div className="mt-3 space-y-3">
                {trending.map((post) => (
                  <BlogCard key={post.slug} post={post} variant="stack" />
                ))}
              </div>
            </div>

            <NewsletterSubscribeBox topic="startup-news" />

            <div className="rounded-[14px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-overline uppercase text-zinc-500">Coverage Policy</p>
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
