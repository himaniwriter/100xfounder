import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileFaqSection } from "@/components/seo/profile-faq-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyIntelligenceDashboard } from "@/components/company/company-intelligence-dashboard";
import { buildCompanyContentExpansion } from "@/lib/company/content-expansion";
import {
  getFounderDirectory,
  getFounderDirectoryLastUpdatedAt,
} from "@/lib/founders/store";
import {
  buildCompanyFaqs,
  buildCompanyProfileSchema,
} from "@/lib/seo/profile-seo";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

type CompanyPageProps = {
  params: { slug: string };
};

async function getCompanyContext(slug: string) {
  const founders = await getFounderDirectory();
  const matches = founders.filter((item) => item.companySlug === slug);
  if (matches.length === 0) {
    return null;
  }

  const primary = matches[0];
  const related = founders
    .filter((item) => item.companySlug !== slug && item.industry === primary.industry)
    .slice(0, 8);
  return { primary, matches, related };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const context = await getCompanyContext(params.slug);

  if (!context) {
    return {
      title: "Company Not Found | 100Xfounder",
    };
  }

  const { primary } = context;

  const canonical = `${getSiteBaseUrl()}/company/${primary.companySlug}`;

  return {
    title: `${primary.companyName} - Founder, Funding Rounds & Hiring | 100Xfounder`,
    description: `View ${primary.companyName}'s profile on 100Xfounder with founder details, total funding, last round, all rounds, and hiring roles in one place.`,
    alternates: {
      canonical,
    },
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const context = await getCompanyContext(params.slug);
  if (!context) notFound();

  const { primary, matches, related } = context;
  const lastUpdatedAt = await getFounderDirectoryLastUpdatedAt();
  const baseUrl = getSiteBaseUrl();
  const expansion = await buildCompanyContentExpansion({
    name: primary.companyName,
    oneLiner: primary.productSummary,
    industry: primary.industry,
    stage: primary.stage,
    location: primary.headquarters ?? "India",
    tags: [primary.industry, primary.stage],
  });
  const faqs = buildCompanyFaqs(primary, matches);
  const schema = buildCompanyProfileSchema({
    baseUrl,
    primary,
    matches,
    faqs,
  });
  const lastUpdatedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(lastUpdatedAt);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CompanyIntelligenceDashboard
          primary={primary}
          matches={matches}
          expansion={expansion}
        />
        <p className="mt-3 text-xs text-zinc-500">Last updated: {lastUpdatedOn}</p>

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-xl font-semibold text-white">Related Companies</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Alternatives in {primary.industry} with comparable market signals.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {related.length > 0 ? (
              related.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-black/25 p-4"
                >
                  <Link href={`/company/${item.companySlug}`} className="text-base font-medium text-white hover:text-indigo-200">
                    {item.companyName}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-400">{item.founderName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/company/${item.companySlug}`}
                      className="rounded-md border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-200 hover:border-white/30"
                    >
                      View Company
                    </Link>
                    <Link
                      href={`/compare/${primary.companySlug}-vs-${item.companySlug}`}
                      className="rounded-md border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-200 hover:bg-indigo-500/20"
                    >
                      Compare Alternatives
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No related companies available yet.</p>
            )}
          </div>
        </section>
        <ProfileFaqSection
          title={`FAQs About ${primary.companyName}`}
          faqs={faqs}
        />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <Footer />
    </main>
  );
}
