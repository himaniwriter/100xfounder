import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { getIndustryOptions } from "@/lib/founders/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Startup Industries Directory | 100Xfounder",
  description:
    "Browse startup intelligence by industry with founders, funding rounds, and hiring signals.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/industries`,
  },
};

export default async function IndustriesPage() {
  const industries = await getIndustryOptions();
  const topIndustry = industries[0];
  const baseUrl = getSiteBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/industries#webpage`,
        url: `${baseUrl}/industries`,
        name: "Startup industries directory",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Industries", item: `${baseUrl}/industries` },
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
            Industries Directory
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Explore startup companies by industry with founder profiles, funding history, and hiring context.
          </p>
        </header>

        <PillarCrosslinks
          context={{
            industry: topIndustry?.label,
          }}
          includeGlobal
          maxLinks={8}
          title="Industry Hub Crosslinks"
          description="Move between industry lists, startup taxonomy pages, and related funding/news routes."
          className="mt-6"
        />

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((item) => (
            <Link
              key={item.slug}
              href={`/industries/${item.slug}`}
              className="rounded-xl border border-white/15 bg-white/[0.03] p-4 transition-colors hover:border-white/30"
            >
              <p className="text-base font-medium text-white">{item.label}</p>
              <p className="mt-2 text-xs text-zinc-400">{item.count} companies tracked</p>
            </Link>
          ))}
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
