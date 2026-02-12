import Link from "next/link";
import { Search, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyLogo } from "@/components/ui/company-logo";
import { GlassCard } from "@/components/ui/glass-card";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { getFounderDirectory, splitRecentlyFunded } from "@/lib/founders/store";

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
  const founders = await getFounderDirectory({ limit: 80 });
  const { recent } = splitRecentlyFunded(founders, 12);
  const featuredFounders = (recent.length > 0 ? recent : founders).slice(0, 3);
  const companyHrefMap = new Map(
    founders.map((item) => [item.companyName.toLowerCase(), `/company/${item.companySlug}`]),
  );
  const fundingTickerItems = [
    "🚀 Deal Alert: Sarvam AI raises $41M",
    "📉 M&A: Zomato acquires Blinkit",
    "💼 Growth Equity: Zepto secures $200M",
    "⚡ Fintech: Perfios closes fresh round",
  ];
  const featuredDeal = {
    company: "Zepto",
    domain: "zeptonow.com",
    headline: "Zepto raises $200M Series E led by StepStone Group.",
    amount: "$200M",
    valuation: "$1.4B",
    investors: "YC, Glade Brook",
    round: "Series E",
    sector: "Quick Commerce",
  };
  const fundingFeed = [
    {
      date: "2h ago",
      company: "Sarvam AI",
      domain: "sarvam.ai",
      round: "Series A",
      amount: "$41M",
      investors: "Lead: Lightspeed India",
    },
    {
      date: "4h ago",
      company: "Juspay",
      domain: "juspay.in",
      round: "Series C",
      amount: "$60M",
      investors: "Lead: SoftBank Vision Fund",
    },
    {
      date: "7h ago",
      company: "Perfios",
      domain: "perfios.com",
      round: "Series D",
      amount: "$80M",
      investors: "Lead: Kedaara Capital",
    },
    {
      date: "10h ago",
      company: "AppsForBharat",
      domain: "appsforbharat.com",
      round: "Series B",
      amount: "$18M",
      investors: "Lead: Fundamentum",
    },
    {
      date: "14h ago",
      company: "BlueStone",
      domain: "bluestone.com",
      round: "Series C",
      amount: "$30M",
      investors: "Lead: Peak XV Partners",
    },
  ];
  const sectorRadar = [
    {
      sector: "AI Infrastructure",
      momentum: "High",
      weeklyRounds: 9,
      href: "/founders?industry=AI",
    },
    {
      sector: "Fintech",
      momentum: "High",
      weeklyRounds: 7,
      href: "/founders?industry=Fintech",
    },
    {
      sector: "B2B SaaS",
      momentum: "Medium",
      weeklyRounds: 5,
      href: "/founders?industry=SaaS",
    },
    {
      sector: "Climate Tech",
      momentum: "Medium",
      weeklyRounds: 3,
      href: "/founders",
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
  const trustLogos = ["Sequoia", "Y Combinator", "Accel", "InfoEdge"];
  const insightCards = [
    {
      title: "The Rise of AI in Delhi",
      href: "/blog?insight=rise-of-ai-in-delhi",
      tag: "AI Intelligence",
      imageUrl: "/images/covers/ai-grid.svg",
    },
    {
      title: "Who Is Funding the Next Flipkart?",
      href: "/blog?insight=who-is-funding-the-next-flipkart",
      tag: "Funding Signals",
      imageUrl: "/images/covers/funding-wire.svg",
    },
    {
      title: "YC W26 Batch Analysis",
      href: "/blog?insight=yc-w26-batch-analysis",
      tag: "YC Tracker",
      imageUrl: "/images/covers/startup-brief.svg",
    },
  ];

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
              The World&apos;s
              {" "}
              <span className="bg-gradient-to-r from-white via-indigo-200 to-zinc-500 bg-clip-text text-transparent">
                Most Accurate
              </span>
              {" "}
              Index of Indian Founders &amp; Startups.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-lg text-zinc-300">
              Access verified contact details, funding signals, and growth metrics for
              10,000+ YC founders and top Indian enterprises. Stop guessing, start
              connecting.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/founders"
                className="inline-flex h-11 items-center rounded-lg bg-[#6366f1] px-5 text-sm font-medium text-white transition-colors hover:bg-[#5458e8]"
              >
                Search the Database
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center rounded-lg border border-white/15 bg-white/5 px-5 text-sm font-medium text-zinc-100 transition-colors hover:border-white/25 hover:text-white"
              >
                Get Full Access
              </Link>
            </div>

            <div className="mx-auto mt-9 max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-2xl">
              <div className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-black/35 px-4">
                <Search className="h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search founders, startups, and signals..."
                  className="h-full flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400">
                  Cmd + K
                </span>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Trusted by investors at:
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
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Why Trust Us</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <GlassCard className="group p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <ShieldCheck className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">Human-Verified Data.</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Unlike automated scrapers, our data is verified by a human research
                team every 90 days.
              </p>
            </GlassCard>

            <GlassCard className="flex flex-col justify-between p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <p className="font-mono text-5xl font-semibold text-white">50M+</p>
              <p className="mt-4 text-sm text-zinc-400">
                Data points indexed across funding, hiring, and revenue signals.
              </p>
            </GlassCard>

            <GlassCard className="group p-6 hover:border-indigo-500/70 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_45px_rgba(99,102,241,0.2)]">
              <Zap className="h-6 w-6 text-indigo-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">First-Mover Advantage.</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Get alerts on stealth startups 3 months before they appear on the news.
              </p>
            </GlassCard>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Market Pulse: Latest Funding Rounds
            </h2>
            <Link
              href="/signals"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
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
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">
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
            </div>
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
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Recently Funded Spotlight
            </h2>
            <Link
              href="/founders"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Open full directory
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredFounders.map((founder) => (
              <GlassCard key={founder.id} className="p-5">
                <div className="flex items-start gap-3">
                  <CompanyLogo
                    companyName={founder.companyName}
                    websiteUrl={founder.websiteUrl}
                    className="h-11 w-11 rounded-xl border border-white/15"
                  />
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

                <div className="mt-4 text-xs">
                  <Link
                    href={`/founders/${founder.slug}`}
                    className="inline-flex items-center gap-1 text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    View Profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md md:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  Direct Contact Access
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  Every profile includes visible contact details, verified tags, and key business
                  signals so your outreach can start immediately.
                </p>
              </div>
              <Link
                href="/founders"
                className="inline-flex h-10 shrink-0 items-center rounded-lg bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5458e8]"
              >
                Open Directory
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Profile Snapshot</p>
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">Mukesh Ambani</h3>
                  <p className="text-sm text-zinc-300">Reliance Industries</p>
                  <p className="text-sm text-zinc-400">Sector: Energy, Telecom, Retail</p>
                </div>
                <div className="mt-5 space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <p className="text-sm text-zinc-300">Email: rmukesh@ril.com</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <p className="text-sm text-zinc-300">Phone: +91 98765 43210</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Verified Access</p>
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">Mukesh Ambani</h3>
                  <p className="text-sm text-zinc-300">Reliance Industries</p>
                  <p className="inline-flex items-center gap-1 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified
                  </p>
                </div>
                <div className="mt-5 space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="rounded-md border border-white/10 bg-white/5 p-2 text-sm text-zinc-200">
                    Email: rmukesh@ril.com
                  </p>
                  <p className="rounded-md border border-white/10 bg-white/5 p-2 text-sm text-zinc-200">
                    Phone: +91 98765 43210
                  </p>
                  <p className="rounded-md border border-white/10 bg-white/5 p-2 text-sm text-zinc-200">
                    LinkedIn: linkedin.com/in/mukeshambani
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Market Intelligence &amp; Deep Dives
            </h2>
            <Link
              href="/blog"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Open blog
            </Link>
          </div>

          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {insightCards.map((item) => (
              <GlassCard
                key={item.title}
                className="min-w-[290px] snap-start p-4 md:min-w-[360px]"
              >
                <NewsCoverImage
                  title={item.title}
                  imageUrl={item.imageUrl}
                  uniqueId={item.title}
                  className="h-32 rounded-lg border border-white/10"
                />
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-zinc-500">{item.tag}</p>
                <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  Read Analysis
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </GlassCard>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
