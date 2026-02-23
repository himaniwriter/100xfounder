import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GetFeaturedClient } from "@/components/featured/get-featured-client";
import {
  buildWhatsAppRedirectPath,
  getInstagramProfileUrl,
} from "@/lib/marketing/outreach";
import { getInstagramFeed } from "@/lib/outreach/instagram";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Get Featured Founder Profile | Build Trust and Inbound | 100Xfounder",
  description:
    "Apply to feature your founder profile on 100Xfounder with one-time plans, verification, and manual review before publish.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/get-featured`,
  },
};

export default async function GetFeaturedPage() {
  const n8nFormUrl = process.env.NEXT_PUBLIC_N8N_FEATURED_FORM_URL ?? "";
  const instagramUrl = getInstagramProfileUrl();
  const instagramFeed = await getInstagramFeed(4);
  const whatsappHeroHref = buildWhatsAppRedirectPath({
    context: "get_featured_hero",
    source: "get_featured_page",
  });

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <Suspense
        fallback={
          <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="h-[780px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          </section>
        }
      >
        <GetFeaturedClient
          n8nFormUrl={n8nFormUrl}
          instagramUrl={instagramUrl}
          instagramFeed={instagramFeed}
          whatsappHeroHref={whatsappHeroHref}
        />
      </Suspense>
      <Footer />
    </main>
  );
}
