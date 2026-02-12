import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileFaqSection } from "@/components/seo/profile-faq-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ProfileTabs } from "@/components/founders/profile-tabs";
import { getFounderDirectory } from "@/lib/founders/store";
import {
  buildFounderFaqs,
  buildFounderProfileSchema,
} from "@/lib/seo/profile-seo";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

type FounderPageProps = { params: { slug: string } };

async function getFounder(slug: string) {
  const items = await getFounderDirectory();
  return items.find((item) => item.slug === slug) ?? null;
}

export async function generateMetadata({ params }: FounderPageProps): Promise<Metadata> {
  const founder = await getFounder(params.slug);
  if (!founder) return { title: "Founder Not Found | 100Xfounder" };
  const baseUrl = getSiteBaseUrl();

  return {
    title: `${founder.founderName} - Founder Profile & Signals | 100Xfounder`,
    description: `Explore founder profile for ${founder.founderName}, including company ${founder.companyName}, funding context, and growth signals on 100Xfounder.`,
    alternates: {
      canonical: `${baseUrl}/founders/${founder.slug}`,
    },
  };
}

export default async function FounderPage({ params }: FounderPageProps) {
  const founder = await getFounder(params.slug);
  if (!founder) notFound();
  const all = await getFounderDirectory();
  const similar = all
    .filter((item) => item.slug !== founder.slug && item.industry === founder.industry)
    .slice(0, 4);
  const baseUrl = getSiteBaseUrl();
  const faqs = buildFounderFaqs(founder);
  const schema = buildFounderProfileSchema({
    baseUrl,
    founder,
    faqs,
    pagePath: `/founders/${founder.slug}`,
  });

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur-[40px]">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {founder.founderName}
          </h1>
          <p className="mt-2 text-lg text-zinc-300">Founder at {founder.companyName}</p>
          <p className="mt-4 text-sm leading-7 text-zinc-300">{founder.productSummary}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">{founder.industry}</span>
            <span className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300">{founder.stage}</span>
          </div>

          <ProfileTabs founder={founder} similar={similar} />
          <ProfileFaqSection
            title={`FAQs About ${founder.founderName}`}
            faqs={faqs}
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/company/${founder.companySlug}`}
              className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
            >
              View Company Profile
            </Link>
            <Link
              href="/founders"
              className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              Back to Directory
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
      <Footer />
    </main>
  );
}
