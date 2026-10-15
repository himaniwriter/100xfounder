import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { formatLaunchDay, listRecentLaunches, SELECTION_LABELS } from "@/lib/launch/queries";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

const baseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  title: "Today's Top Startup Launches | 100xFounder",
  description:
    "The best new products launched on Product Hunt each day, picked by votes and curated by 100xFounder.",
  alternates: { canonical: `${baseUrl}/launches` },
};

export default async function LaunchesPage() {
  const launches = await listRecentLaunches();
  const days = new Map<string, typeof launches>();
  for (const launch of launches) {
    const day = formatLaunchDay(launch.launchedAt);
    days.set(day, [...(days.get(day) || []), launch]);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Daily launches</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          The best new startups, every day.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-zinc-300 sm:text-lg">
          Each day we pick the top launches from Product Hunt and invite their founders to share
          the story behind what they built.{" "}
          <Link href="/spotlight" className="text-indigo-300 underline-offset-2 hover:underline">
            Read founder spotlights
          </Link>
          .
        </p>

        {days.size === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/15 bg-white/[0.03] p-6 text-zinc-400">
            New launches are being added. Check back soon.
          </p>
        ) : null}

        {[...days.entries()].map(([day, items]) => (
          <section key={day} className="mt-12">
            <h2 className="text-sm uppercase tracking-[0.18em] text-zinc-400">{day}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {items.map((launch) => (
                <Link
                  key={launch.id}
                  href={`/launches/${launch.slug}`}
                  className="flex gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-4 transition-colors hover:border-white/25"
                >
                  {launch.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={launch.thumbnailUrl}
                      alt={`${launch.name} logo`}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-xl bg-white/10" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{launch.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-300">{launch.tagline}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span>▲ {launch.votesCount}</span>
                      {launch.selectionReasons.slice(0, 1).map((reason) => (
                        <span key={reason} className="rounded-full border border-indigo-400/30 px-2 text-indigo-200">
                          {SELECTION_LABELS[reason] ?? reason}
                        </span>
                      ))}
                      {launch.spotlights.length > 0 ? (
                        <span className="rounded-full border border-emerald-400/30 px-2 text-emerald-200">
                          Founder spotlight
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>
      <Footer />
    </main>
  );
}
