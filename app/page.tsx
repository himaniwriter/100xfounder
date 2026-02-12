import Link from "next/link";
import { Search, ShieldCheck, Zap, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";
import { getFounderDirectory, splitRecentlyFunded } from "@/lib/founders/store";

export default async function HomePage() {
  const founders = await getFounderDirectory({ limit: 80 });
  const { recent } = splitRecentlyFunded(founders, 12);
  const featuredFounders = (recent.length > 0 ? recent : founders).slice(0, 3);
  const marqueeItems = Array.from(
    new Set(founders.map((item) => item.companyName)),
  );
  const trustLogos = ["Sequoia", "Y Combinator", "Accel", "InfoEdge"];
  const insightCards = [
    {
      title: "The Rise of AI in Delhi",
      href: "/blog?insight=rise-of-ai-in-delhi",
      tag: "AI Intelligence",
    },
    {
      title: "Who Is Funding the Next Flipkart?",
      href: "/blog?insight=who-is-funding-the-next-flipkart",
      tag: "Funding Signals",
    },
    {
      title: "YC W26 Batch Analysis",
      href: "/blog?insight=yc-w26-batch-analysis",
      tag: "YC Tracker",
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
              <span>
                Live Updates: 12 new startups added today • 500+ phone numbers verified this week.
              </span>
              <span aria-hidden="true">
                Live Updates: 12 new startups added today • 500+ phone numbers verified this week.
              </span>
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

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
            Recently Indexed Companies
          </p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="flex w-max gap-3 px-4 py-4">
              {[...marqueeItems, ...marqueeItems].slice(0, 24).map((company, index) => (
                <div
                  key={`${company}-${index}`}
                  className="rounded-lg border border-white/10 bg-black/30 px-5 py-2 text-sm text-zinc-300"
                >
                  {company}
                </div>
              ))}
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
                  <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-zinc-200">
                    {founder.founderName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
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
                  Unlock the Full Picture
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  Public profiles give you the name. Pro membership gives you the handshake.
                  Access direct contact info for $X/month.
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex h-10 shrink-0 items-center rounded-lg bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5458e8]"
              >
                View Membership Plans
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GlassCard className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Public View</p>
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-semibold text-white">Mukesh Ambani</h3>
                  <p className="text-sm text-zinc-300">Reliance Industries</p>
                  <p className="text-sm text-zinc-400">Sector: Energy, Telecom, Retail</p>
                </div>
                <div className="mt-5 space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="relative rounded-md border border-white/10 bg-white/5 p-2">
                    <p className="select-none text-sm text-zinc-300 blur-sm">Email: r***@ril.com</p>
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                  </div>
                  <div className="relative rounded-md border border-white/10 bg-white/5 p-2">
                    <p className="select-none text-sm text-zinc-300 blur-sm">Phone: +91 98******10</p>
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <Lock className="h-4 w-4 text-zinc-500" />
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Member View</p>
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
                    Email: r***@ril.com
                  </p>
                  <p className="rounded-md border border-white/10 bg-white/5 p-2 text-sm text-zinc-200">
                    Phone: +91 98******10
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
                <div className="h-32 rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.32),rgba(10,10,10,0.35)_60%)]" />
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
