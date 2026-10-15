import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { listPublishedSpotlights } from "@/lib/launch/queries";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

const baseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  title: "Founder Spotlights: Stories Behind New Startups | 100xFounder",
  description:
    "Founders of the best new startups share why they built their product, what they learned, and what's next.",
  alternates: { canonical: `${baseUrl}/spotlight` },
};

export default async function SpotlightIndexPage() {
  const spotlights = await listPublishedSpotlights();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Founder spotlights</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          The stories behind the best new startups.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-zinc-300 sm:text-lg">
          Founders of top <Link href="/launches" className="text-indigo-300 hover:underline">daily launches</Link>{" "}
          tell us why they built what they built.
        </p>

        {spotlights.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/15 bg-white/[0.03] p-6 text-zinc-400">
            The first spotlights are on their way.
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spotlights.map((spotlight) => (
              <Link
                key={spotlight.id}
                href={`/spotlight/${spotlight.slug}`}
                className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 transition-colors hover:border-white/25"
              >
                <div className="flex items-center gap-3">
                  {spotlight.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={spotlight.photoUrl} alt={spotlight.founderName} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-white/10" />
                  )}
                  <div>
                    <h2 className="font-semibold text-white">{spotlight.founderName}</h2>
                    <p className="text-xs text-zinc-400">
                      {spotlight.role ? `${spotlight.role}, ` : ""}
                      {spotlight.product.name}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm text-zinc-300">{spotlight.storyOrigin}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
