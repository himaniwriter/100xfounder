import Link from "next/link";
import { Search } from "lucide-react";
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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#EDEDED]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl md:text-7xl">
              The Index of Ambition.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
              Discover founder and company records from your uploaded PDF, with
              profile links and YC founder search references.
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 backdrop-blur-md">
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
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
            Company Records
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
                    className="text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    View Profile
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
