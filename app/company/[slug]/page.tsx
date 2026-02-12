import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileFaqSection } from "@/components/seo/profile-faq-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyIntelligenceDashboard } from "@/components/company/company-intelligence-dashboard";
import { buildCompanyContentExpansion } from "@/lib/company/content-expansion";
import { getFounderDirectory } from "@/lib/founders/store";
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
  const matches = (await getFounderDirectory()).filter((item) => item.companySlug === slug);
  if (matches.length === 0) {
    return null;
  }

  const primary = matches[0];
  return { primary, matches };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const context = await getCompanyContext(params.slug);

  if (!context) {
    return {
      title: "Company Not Found | 100Xfounder",
    };
  }

  const { primary } = context;

  return {
    title: `${primary.companyName} - Founder, Funding & Signals | 100Xfounder`,
    description: `View ${primary.companyName}'s profile on 100Xfounder. Track their growth signals, tech stack, and founder ${primary.founderName}. Access verified contact details.`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const context = await getCompanyContext(params.slug);
  if (!context) notFound();

  const { primary, matches } = context;
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

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CompanyIntelligenceDashboard
          primary={primary}
          matches={matches}
          expansion={expansion}
        />
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
