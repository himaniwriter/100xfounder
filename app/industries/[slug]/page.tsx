import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getFoundersByIndustrySlug, getIndustryOptions } from "@/lib/founders/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type IndustryPageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const options = await getIndustryOptions();
  return options.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const context = await getFoundersByIndustrySlug(params.slug);
  if (!context) {
    return { title: "Industry Not Found | 100Xfounder" };
  }

  const canonical = `${getSiteBaseUrl()}/industries/${params.slug}`;
  return {
    title: `Top ${context.label} Startups | 100Xfounder`,
    description: `Explore ${context.label} startups with founders, funding rounds, and hiring signals.`,
    alternates: { canonical },
  };
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const context = await getFoundersByIndustrySlug(params.slug);
  if (!context) {
    notFound();
  }

  const baseUrl = getSiteBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/industries/${params.slug}#webpage`,
        url: `${baseUrl}/industries/${params.slug}`,
        name: `${context.label} startup directory`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Industries", item: `${baseUrl}/industries` },
          { "@type": "ListItem", position: 3, name: context.label, item: `${baseUrl}/industries/${params.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Industry Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.label} Startups
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            {context.companies.length} companies indexed with founder context, funding rounds, and hiring signals.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Founder</th>
                  <th className="px-4 py-3">Funding</th>
                  <th className="px-4 py-3">Hiring</th>
                </tr>
              </thead>
              <tbody>
                {context.companies.slice(0, 500).map((item) => (
                  <tr key={item.id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 text-zinc-100">
                      <Link href={`/company/${item.companySlug}`} className="hover:text-white">
                        {item.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <Link href={`/founders/${item.slug}`} className="hover:text-white">
                        {item.founderName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.fundingTotalDisplay ?? item.fundingInfo ?? "Undisclosed"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.isHiring ? (item.hiringRoles?.slice(0, 2).join(", ") || "Hiring now") : "No active signal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
