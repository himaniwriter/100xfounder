import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | 100Xfounder",
  description:
    "Compare 100Xfounder plans for founder visibility, discovery tools, and startup intelligence workflows.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/pricing`,
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <Suspense
        fallback={
          <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="h-[420px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          </section>
        }
      >
        <PricingClient />
      </Suspense>
      <Footer />
    </main>
  );
}
