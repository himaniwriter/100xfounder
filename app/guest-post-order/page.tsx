import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GuestPostOrderForm } from "@/components/outreach/guest-post-order-form";
import { buildWhatsAppRedirectPath } from "@/lib/marketing/outreach";
import { GUEST_POST_PACKAGES } from "@/lib/outreach/constants";
import { getSiteBaseUrl } from "@/lib/sitemap";

type GuestPostOrderPageProps = {
  searchParams?: {
    package?: string;
  };
};

export const metadata: Metadata = {
  title: "Guest Post Order Form | 100Xfounder",
  description:
    "Submit your startup guest post requirements for editorial review and distribution on 100Xfounder.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/guest-post-order`,
  },
};

export default function GuestPostOrderPage({ searchParams }: GuestPostOrderPageProps) {
  const selectedPackage = searchParams?.package;
  const whatsappHref = buildWhatsAppRedirectPath({
    context: "guest_post_order",
    source: "order_page",
    plan: selectedPackage,
  });

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Order Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Guest Post Order
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Share your story angle, target audience, and references. Our editorial team will review
            the request, confirm scope, and share next steps.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/guest-post-marketplace"
              className="inline-flex items-center rounded-md border border-white/15 bg-black/30 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-white/30"
            >
              View Packages
            </Link>
            <a
              href={whatsappHref}
              className="inline-flex items-center rounded-md border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              Talk on WhatsApp
            </a>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
            <GuestPostOrderForm defaultPackageKey={selectedPackage} />
          </div>

          <aside className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white">Available Packages</h2>
            <div className="mt-3 space-y-3">
              {GUEST_POST_PACKAGES.map((pkg) => (
                <article key={pkg.key} className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-sm font-medium text-zinc-100">{pkg.label}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    ₹{pkg.priceInr.toLocaleString("en-IN")} / ${pkg.priceUsd}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Payment collection remains external. You will receive payment instructions after review.
            </p>
          </aside>
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Submission checklist for faster approval
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Orders move faster when the article brief is specific and source-backed. Include a clear audience,
            the business angle you want to highlight, and any URLs that validate your claims. Editorial review
            prioritizes submissions that help readers make better decisions, not generic promotional copy.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Before submitting, review
            <Link href="/editorial-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Editorial Policy"}
            </Link>
            {" and "}
            <Link href="/methodology" className="text-indigo-300 hover:text-indigo-200">
              {"Methodology"}
            </Link>
            . For corrections or update requests after publishing, use
            <Link href="/corrections-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Corrections Policy"}
            </Link>
            {" and "}
            <Link href="/contact-newsroom" className="text-indigo-300 hover:text-indigo-200">
              {"Contact Newsroom"}
            </Link>
            .
          </p>
        </section>
      </section>

      <Footer />
    </main>
  );
}
