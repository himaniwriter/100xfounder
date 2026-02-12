import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyIntelligenceDashboard } from "@/components/company/company-intelligence-dashboard";
import { buildCompanyContentExpansion } from "@/lib/company/content-expansion";
import { getFounderDirectory } from "@/lib/founders/store";

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
  const expansion = await buildCompanyContentExpansion({
    name: primary.companyName,
    oneLiner: primary.productSummary,
    industry: primary.industry,
    stage: primary.stage,
    location: primary.headquarters ?? "India",
    tags: [primary.industry, primary.stage],
  });

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: primary.companyName,
    url: primary.websiteUrl ?? undefined,
    founder: {
      "@type": "Person",
      name: primary.founderName,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: primary.headquarters ?? "Unknown",
      addressCountry: "IN",
    },
    sameAs: [primary.linkedinUrl, primary.twitterUrl].filter(Boolean),
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CompanyIntelligenceDashboard
          primary={primary}
          matches={matches}
          expansion={expansion}
        />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Footer />
    </main>
  );
}
