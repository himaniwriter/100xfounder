import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { getStageOptions } from "@/lib/founders/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Startup Stages Directory | 100Xfounder",
  description: "Browse startup companies by funding stage with founder, hiring, and round data.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/stages`,
  },
};

export default async function StagesPage() {
  const stages = await getStageOptions();
  const topStage = stages[0];
  const baseUrl = getSiteBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/stages#webpage`,
        url: `${baseUrl}/stages`,
        name: "Startup stage directory",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Stages", item: `${baseUrl}/stages` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">SEO Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Startup Stages Directory
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Navigate startups by stage from Seed to Series and late growth profiles.
          </p>
        </header>

        <PillarCrosslinks
          context={{
            stage: topStage?.label,
          }}
          includeGlobal
          maxLinks={8}
          title="Stage Hub Crosslinks"
          description="Traverse stage pages with related startup taxonomy and funding newsroom routes."
          className="mt-6"
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((item) => (
            <Link
              key={item.slug}
              href={`/stages/${item.slug}`}
              className="rounded-xl border border-white/15 bg-white/[0.03] p-4 transition-colors hover:border-white/30"
            >
              <p className="text-base font-medium text-white">{item.label}</p>
              <p className="mt-2 text-xs text-zinc-400">{item.count} companies tracked</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Stage-based startup analysis guide
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Stage pages help you separate startup narratives that look similar on the surface but operate
            under very different constraints. Early-stage teams optimize for discovery and speed, while
            later-stage teams optimize for scale, efficiency, and governance. Comparing companies within the
            same stage gives cleaner benchmarks for funding, hiring, and product expansion.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Use this directory with
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding-round coverage"}
            </Link>
            , 
            <Link href="/startups/funding-round" className="text-indigo-300 hover:text-indigo-200">
              {" startup cohorts by round"}
            </Link>
            , and
            <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
              {" country hubs"}
            </Link>
            {" to get a stronger market view before making investment, hiring, or partnership decisions."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/topics"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Topic Hubs
            </Link>
            <Link
              href="/signals"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Signals Feed
            </Link>
            <Link
              href="/founders"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Founder Directory
            </Link>
          </div>
        </section>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <Footer />
    </main>
  );
}
