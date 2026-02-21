import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getFundingRoundOptions } from "@/lib/news/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Funding Round News Hubs | 100Xfounder",
  description:
    "Explore startup newsroom coverage by funding stage including seed, Series A, growth, and late-stage updates.",
};

export default async function FundingRoundsPage() {
  const stages = await getFundingRoundOptions(40);
  const baseUrl = getSiteBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/funding-rounds#webpage`,
        url: `${baseUrl}/funding-rounds`,
        name: "Funding round news hubs",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Funding Rounds", item: `${baseUrl}/funding-rounds` },
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
            Funding Round Coverage
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Stage-focused newsroom pages for faster tracking of capital movement from seed
            through late-stage rounds.
          </p>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <Link
              key={stage.slug}
              href={`/funding-rounds/${stage.slug}`}
              className="rounded-xl border border-white/15 bg-white/[0.03] p-4 transition-colors hover:border-white/30"
            >
              <p className="text-base font-medium text-white">{stage.label}</p>
              <p className="mt-2 text-xs text-zinc-400">{stage.count} companies tracked</p>
            </Link>
          ))}
        </section>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
