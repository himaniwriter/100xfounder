import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GetFeaturedClient } from "@/components/featured/get-featured-client";

export const metadata: Metadata = {
  title: "Get Featured Founder Profile | Build Trust and Inbound | 100Xfounder",
  description:
    "Apply to feature your founder profile on 100Xfounder with one-time plans, verification, and manual review before publish.",
};

export default function GetFeaturedPage() {
  const n8nFormUrl = process.env.NEXT_PUBLIC_N8N_FEATURED_FORM_URL ?? "";

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <GetFeaturedClient n8nFormUrl={n8nFormUrl} />
      <Footer />
    </main>
  );
}
