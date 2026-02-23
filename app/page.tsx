import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { BlogCard } from "@/components/blog/blog-card";
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { HeroCtaGroup } from "@/components/home/hero-cta-group";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { InstagramFeedGrid } from "@/components/social/instagram-feed-grid";
import { getBlogHomeSections } from "@/lib/blog/store";
import { readHomepageContent } from "@/lib/content/homepage-content";
import { countryToSlug } from "@/lib/founders/country-tier";
import { getFounderDirectory, splitRecentlyFunded } from "@/lib/founders/store";
import { getInstagramProfileUrl } from "@/lib/marketing/outreach";
import { getInstagramFeed } from "@/lib/outreach/instagram";
import { getSiteBaseUrl } from "@/lib/sitemap";

const baseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  title: "100Xfounder | Founder Intelligence and Startup Newsroom",
  description:
    "Discover verified founder profiles, startup funding signals, and daily newsroom coverage across India and US startup ecosystems.",
  alternates: {
    canonical: `${baseUrl}/`,
  },
  openGraph: {
    title: "100Xfounder | Founder Intelligence and Startup Newsroom",
    description:
      "Discover verified founder profiles, startup funding signals, and daily newsroom coverage across India and US startup ecosystems.",
    url: `${baseUrl}/`,
    type: "website",
  },
};

function parseAmountToMillions(amount: string): number {
  const normalized = amount.trim().toUpperCase();
  const numericValue = Number(normalized.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(numericValue)) {
    return 0;
  }
  if (normalized.includes("B")) return numericValue * 1000;
  if (normalized.includes("K")) return numericValue / 1000;
  return numericValue;
}

export default async function HomePage() {
  const homepageContent = await readHomepageContent();
  const founders = await getFounderDirectory({ limit: 80 });
  const instagramUrl = getInstagramProfileUrl();
  const instagramFeed = await getInstagramFeed(6);
  const { recent } = splitRecentlyFunded(founders, 12);
  const featuredFounders = (recent.length > 0 ? recent : founders).slice(0, 3);
  const companyHrefMap = new Map(
    founders.map((item) => [item.companyName.toLowerCase(), `/company/${item.companySlug}`]),
  );
  const fundingTickerItems = [
    "🚀 Deal Alert: OpenAI secures $6.6B strategic funding",
    "🤖 AI Signal: Anthropic expands enterprise model stack",
    "💼 Growth Equity: Zepto secures $200M",
    "🏦 Fintech: Ramp raises fresh growth capital",
  ];
  const featuredDeal = {
    company: "OpenAI",
    domain: "openai.com",
    headline: "OpenAI secures a $6.6B strategic round to scale frontier AI infrastructure.",
    amount: "$6.6B",
    valuation: "$157B",
    investors: "Microsoft, Thrive, Altimeter",
    round: "Strategic",
    sector: "AI Infrastructure",
  };
  const fundingFeed = [
    {
      date: "2h ago",
      company: "Perplexity",
      domain: "perplexity.ai",
      round: "Series C",
      amount: "$500M",
      investors: "Lead: IVP",
    },
    {
      date: "4h ago",
      company: "Anthropic",
      domain: "anthropic.com",
      round: "Strategic",
      amount: "$4B",
      investors: "Lead: Amazon",
    },
    {
      date: "7h ago",
      company: "Zepto",
      domain: "zeptonow.com",
      round: "Series D",
      amount: "$200M",
      investors: "Lead: StepStone Group",
    },
    {
      date: "10h ago",
      company: "Sarvam AI",
      domain: "sarvam.ai",
      round: "Series B",
      amount: "$41M",
      investors: "Lead: Lightspeed India",
    },
    {
      date: "14h ago",
      company: "Ramp",
      domain: "ramp.com",
      round: "Growth",
      amount: "$150M",
      investors: "Lead: Khosla Ventures",
    },
  ];
  const sectorRadar = [
    {
      sector: "US AI Infrastructure",
      momentum: "High",
      weeklyRounds: 11,
      href: "/founders?industry=AI+Infrastructure",
    },
    {
      sector: "India Fintech",
      momentum: "High",
      weeklyRounds: 7,
      href: "/founders?industry=Fintech",
    },
    {
      sector: "US Fintech",
      momentum: "Medium",
      weeklyRounds: 6,
      href: "/founders?location=New+York",
    },
    {
      sector: "India AI Founders",
      momentum: "Medium",
      weeklyRounds: 4,
      href: "/founders?location=Bangalore",
    },
  ];
  const isMegaRound = parseAmountToMillions(featuredDeal.amount) >= 100;
  const featuredDealHref =
    companyHrefMap.get(featuredDeal.company.toLowerCase()) ??
    `/signals?company=${encodeURIComponent(featuredDeal.company)}`;
  const fundingFeedWithLinks = fundingFeed.map((item) => ({
    ...item,
    href:
      companyHrefMap.get(item.company.toLowerCase()) ??
      `/signals?company=${encodeURIComponent(item.company)}`,
  }));
  const marqueeItems = Array.from(
    new Set(founders.map((item) => item.companyName)),
  );
  const { posts: blogPosts } = await getBlogHomeSections();
  const latestHomeArticles = blogPosts.slice(0, 12);
  const leadHomeArticle = latestHomeArticles[0] ?? null;
  const headlineArticles = latestHomeArticles.slice(1, 7);
  const marketPulseTrending = blogPosts.filter((post) => post.isTrending).slice(0, 3);
  const marketPulseTrendingSlugs = new Set(
    marketPulseTrending.map((post) => post.slug),
  );
  const marketPulseLatest = blogPosts
    .filter((post) => !marketPulseTrendingSlugs.has(post.slug))
    .slice(0, 3);
  const marketPulseSeed = [
    ...marketPulseTrending.map((post) => ({
      post,
      badge: "Trending" as const,
    })),
    ...marketPulseLatest.map((post) => ({
      post,
      badge: "Latest" as const,
    })),
  ];
  const marketPulseUsedSlugs = new Set(
    marketPulseSeed.map((item) => item.post.slug),
  );
  const marketPulseFallback = blogPosts
    .filter((post) => !marketPulseUsedSlugs.has(post.slug))
    .map((post) => ({
      post,
      badge: "Latest" as const,
    }));
  const marketPulseNews = [...marketPulseSeed, ...marketPulseFallback].slice(0, 6);
  const recentCategoryWindow = blogPosts.slice(0, 24);
  const categoryBuckets = new Map<string, typeof blogPosts>();
  recentCategoryWindow.forEach((post) => {
    const key = post.category?.trim() || "Founder Intelligence";
    const existing = categoryBuckets.get(key) ?? [];
    existing.push(post);
    categoryBuckets.set(key, existing);
  });
  const categorySections = Array.from(categoryBuckets.entries())
    .map(([category, posts]) => ({
      category,
      count: posts.length,
      posts: posts.slice(0, 4),
    }))
    .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category))
    .slice(0, 4);
  const topCountrySlug =
    countryToSlug(
      founders.find((item) => (item.country ?? "Unknown") !== "Unknown")?.country ?? "India",
    ) || "india";
  const discoverModules = [
    {
      title: "Topic Hubs",
      description: "Clustered newsroom pages organized by startup themes and search intent.",
      href: "/topics",
      label: "Explore Topics",
    },
    {
      title: "Country News",
      description: "Country-level startup coverage with funding and ecosystem movement context.",
      href: `/countries/${topCountrySlug}/news`,
      label: "Open Country News",
    },
    {
      title: "Funding Round Desk",
      description: "Track stage-based funding coverage from seed through late-stage rounds.",
      href: "/funding-rounds",
      label: "Track Funding News",
    },
  ];
  const trustLogos = ["Sequoia", "Y Combinator", "Accel", "Andreessen Horowitz"];
  const heroTitle = homepageContent.heroTitle;
  const highlightedPhrase = "Discovered";
  const phraseIndex = heroTitle.toLowerCase().indexOf(highlightedPhrase.toLowerCase());
  const heroTitleBefore = phraseIndex >= 0 ? heroTitle.slice(0, phraseIndex) : heroTitle;
  const heroTitleAfter =
    phraseIndex >= 0
      ? heroTitle.slice(phraseIndex + highlightedPhrase.length)
      : "";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#EDEDED]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[14rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_72%)] blur-3xl" />
      </div>

      <div className="relative z-10">
        <section className="border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="overflow-hidden">
            <div className="ticker-track">
              <span>{fundingTickerItems.join(" • ")}</span>
              <span aria-hidden="true">{fundingTickerItems.join(" • ")}</span>
            </div>
          </div>
        </section>

        <Navbar />

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              {phraseIndex >= 0 ? (
                <>
                  {heroTitleBefore}
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-zinc-500 bg-clip-text text-transparent">
                    {highlightedPhrase}
                  </span>
                  {heroTitleAfter}
                </>
              ) : (
                heroTitle
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg text-zinc-300">
              {homepageContent.heroSubtitle}
            </p>

            <HeroCtaGroup
              primaryHref={homepageContent.primaryCtaHref}
              primaryLabel={homepageContent.primaryCtaLabel}
              secondaryHref={homepageContent.secondaryCtaHref}
              secondaryLabel={homepageContent.secondaryCtaLabel}
            />

            <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
              <HomeSearchBar />

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Followed by investors and operators at:
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {trustLogos.map((logo) => (
                    <div
                      key={logo}
                      className="rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium tracking-wide text-zinc-400 grayscale"
                    >
                      {logo}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Why CEOs Choose 100Xfounder</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard className="group p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <ShieldCheck className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">Credibility That Converts.</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Profiles are reviewed by humans so investors, media, and partners can trust your
                story before they reach out.
              </p>
            </GlassCard>

            <GlassCard className="flex flex-col justify-between p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <p className="font-mono text-5xl font-semibold text-white">50M+</p>
              <p className="mt-4 text-sm text-zinc-400">
                Structured data points across founder, funding, and hiring signals to improve
                discoverability and profile quality.
              </p>
            </GlassCard>

            <GlassCard className="group p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <Zap className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">Search + AI Visibility.</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Your profile is built to appear in high-intent searches and AI answer surfaces
                where buyers and talent do research.
              </p>
            </GlassCard>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
            Recently Indexed Companies
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex w-max gap-3 px-4 py-4">
              {[...marqueeItems, ...marqueeItems].slice(0, 24).map((company, index) => {
                const href =
                  companyHrefMap.get(company.toLowerCase()) ??
                  `/signals?company=${encodeURIComponent(company)}`;
                return (
                  <Link
                    key={`${company}-${index}`}
                    href={href}
                    className="rounded-lg border border-white/10 bg-black/30 px-5 py-2 text-sm text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
                  >
                    {company}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Recently Funded Spotlight
            </h2>
            <Link
              href="/founders"
              className="glass-ghost-btn"
            >
              Open full directory
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredFounders.map((founder) => (
              <Link key={founder.id} href={`/founders/${founder.slug}`} className="group block">
                <GlassCard className="h-full cursor-pointer p-5 transition-all group-hover:scale-[1.015] group-hover:border-indigo-400/45 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0">
                      <CompanyLogo
                        companyName={founder.companyName}
                        websiteUrl={founder.websiteUrl}
                        className="h-11 w-11 rounded-xl border border-white/15"
                      />
                      <FounderAvatar
                        name={founder.founderName}
                        imageUrl={founder.avatarUrl}
                        linkedinUrl={founder.linkedinUrl}
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border border-white/20 bg-black/40"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {founder.founderName}
                      </h3>
                      <p className="text-sm text-zinc-300">{founder.companyName}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {founder.productSummary}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                      {founder.industry}
                    </span>
                    <span className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300">
                      {founder.stage}
                    </span>
                  </div>

                  <span className="glass-ghost-btn glass-ghost-btn-compact mt-4 inline-flex items-center gap-1 text-indigo-200">
                    View Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Trending News by Category
            </h2>
            <Link
              href="/blog"
              className="glass-ghost-btn"
            >
              Open Blog
            </Link>
          </div>

          <p className="mb-5 max-w-3xl text-sm text-zinc-400">
            Browse the day&apos;s top startup headlines organized by high-signal categories.
          </p>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            {leadHomeArticle ? <BlogCard post={leadHomeArticle} variant="hero" priority /> : null}

            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Trending Headlines
              </p>

              <div className="mt-3 divide-y divide-white/10">
                {headlineArticles.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block py-3 transition-colors hover:text-white"
                  >
                    <p className="text-base font-medium leading-snug text-zinc-100">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {post.category} • {post.readingTime}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {categorySections.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {categorySections.map((section) => (
                <article
                  key={section.category}
                  className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-200">
                      {section.category}
                    </h3>
                    <span className="rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-400">
                      {section.count} stories
                    </span>
                  </div>

                  <div className="space-y-2">
                    {section.posts.map((post, index) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group grid grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-lg border border-white/10 bg-black/30 p-2.5 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                      >
                        <NewsCoverImage
                          title={post.title}
                          imageUrl={post.thumbnail}
                          uniqueId={`${section.category}-${post.slug}`}
                          className="h-16 w-full rounded-md border border-white/10"
                          imageClassName="transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="min-w-0">
                          <p
                            className={
                              index === 0
                                ? "line-clamp-2 text-sm font-semibold text-white"
                                : "line-clamp-2 text-sm text-zinc-300"
                            }
                          >
                            {post.title}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {post.readingTime}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={`/blog?category=${encodeURIComponent(section.category)}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    View {section.category} News
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Market Pulse: Latest Funding Rounds
            </h2>
            <Link
              href="/signals"
              className="glass-ghost-btn"
            >
              Open full signals feed
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]">
            <aside className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
              <h3 className="text-xs uppercase tracking-[0.16em] text-zinc-500">Funding Radar</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Live intelligence across high-velocity sectors, refreshed every 2 hours.
              </p>

              <div className="mt-4 space-y-2">
                {sectorRadar.map((item) => (
                  <Link
                    key={item.sector}
                    href={item.href}
                    className="block rounded-xl border border-white/10 bg-black/25 p-3 transition-colors hover:border-white/30"
                  >
                    <p className="text-sm font-medium text-white">{item.sector}</p>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{item.weeklyRounds} rounds this week</span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-zinc-300">
                        {item.momentum}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>

            <div className="space-y-4">
              <Link
                href={featuredDealHref}
                className="group relative block overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(20,30,62,0.95)_0%,rgba(37,99,235,0.18)_50%,rgba(9,14,28,0.95)_100%)] p-6 shadow-[0_0_36px_rgba(37,99,235,0.16)] transition-colors hover:border-white/30"
              >
                <div className="pointer-events-none absolute -right-24 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),transparent_72%)] blur-3xl" />
                {isMegaRound ? (
                  <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
                    🦄 Mega Round
                  </span>
                ) : null}

                <div className="mt-4 flex items-start gap-3">
                  <CompanyLogo
                    companyName={featuredDeal.company}
                    domain={featuredDeal.domain}
                    className="h-11 w-11 rounded-xl border border-white/20"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
                      Featured Deal • {featuredDeal.sector}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {featuredDeal.headline}
                    </h3>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-zinc-100">
                    Amount: {featuredDeal.amount}
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-zinc-100">
                    Valuation: {featuredDeal.valuation}
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-sm text-zinc-100">
                    Investors: {featuredDeal.investors}
                  </span>
                </div>
              </Link>

              <div className="rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-[40px]">
                <div className="hidden grid-cols-[88px_minmax(0,1.4fr)_110px_100px_minmax(0,1fr)] gap-3 border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500 md:grid">
                  <span>Date</span>
                  <span>Company</span>
                  <span>Round</span>
                  <span>Amount</span>
                  <span>Investors</span>
                </div>

                <div className="divide-y divide-white/10">
                  {fundingFeedWithLinks.map((item) => (
                    <Link
                      key={`${item.company}-${item.date}`}
                      href={item.href}
                      className="grid gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] md:grid-cols-[88px_minmax(0,1.4fr)_110px_100px_minmax(0,1fr)] md:items-center"
                    >
                      <p className="text-xs text-zinc-500">{item.date}</p>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <CompanyLogo
                          companyName={item.company}
                          domain={item.domain}
                          className="h-8 w-8 shrink-0 rounded-lg border border-white/20"
                        />
                        <p className="truncate text-sm font-medium text-white">{item.company}</p>
                      </div>
                      <span className="w-fit rounded-full border border-blue-400/35 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">
                        {item.round}
                      </span>
                      <p className="text-sm font-medium text-emerald-300">{item.amount}</p>
                      <p className="truncate text-xs text-zinc-400">{item.investors}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-[40px] sm:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-200">
                    Trending & Latest on the Desk
                  </h3>
                  <Link
                    href="/blog"
                    aria-label="View all newsroom posts"
                    className="inline-flex items-center gap-1 text-xs text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    View all newsroom
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {marketPulseNews.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {marketPulseNews.map((item) => (
                      <Link
                        key={`market-pulse-${item.post.slug}`}
                        href={`/blog/${item.post.slug}`}
                        className="group rounded-xl border border-white/10 bg-black/30 p-2.5 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                      >
                        <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
                          <NewsCoverImage
                            title={item.post.title}
                            imageUrl={item.post.thumbnail}
                            uniqueId={`market-pulse-${item.post.slug}`}
                            className="h-20 w-full rounded-md border border-white/10"
                            imageClassName="transition-transform duration-500 group-hover:scale-105"
                          />

                          <div className="min-w-0">
                            <span
                              className={
                                item.badge === "Trending"
                                  ? "inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-indigo-200"
                                  : "inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-emerald-200"
                              }
                            >
                              {item.badge}
                            </span>
                            <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-100 transition-colors group-hover:text-white">
                              {item.post.title}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-500">
                              {item.post.category} • {item.post.readingTime}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-4 text-sm text-zinc-400">
                    No newsroom stories available right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Discover Now
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Jump into the newsroom sections that are refreshed for search and AI citation surfaces.
              </p>
            </div>
            <Link
              href="/blog"
              className="glass-ghost-btn"
            >
              Open Newsroom
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {discoverModules.map((module) => (
              <Link
                key={module.title}
                href={module.href}
                className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 transition-colors hover:border-white/30"
              >
                <p className="text-sm uppercase tracking-[0.14em] text-zinc-500">{module.title}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{module.description}</p>
                <span className="mt-4 inline-flex items-center rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200">
                  {module.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <InstagramFeedGrid
            items={instagramFeed}
            profileUrl={instagramUrl}
            title="Instagram Feed"
            description="Latest stories and founder snapshots from @100x.founder."
          />
        </section>

        <Footer />
      </div>
    </main>
  );
}
