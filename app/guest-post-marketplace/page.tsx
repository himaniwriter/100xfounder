import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { buildWhatsAppRedirectPath } from "@/lib/marketing/outreach";
import { GUEST_POST_PACKAGES } from "@/lib/outreach/constants";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Guest Post Marketplace | 100Xfounder",
  description:
    "Choose a guest post distribution package to publish startup stories on 100Xfounder with editorial review.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/guest-post-marketplace`,
  },
};

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GuestPostMarketplacePage() {
  const whatsappHref = buildWhatsAppRedirectPath({
    context: "guest_post_marketplace",
    source: "marketplace_page",
  });

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sponsored Distribution</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Guest Post Marketplace
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Publish founder and startup updates in the 100Xfounder newsroom with editorial review,
            SEO formatting, and distribution support.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/guest-post-order"
              className="inline-flex items-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-4 py-2 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/25"
            >
              Place Guest Post Order
            </Link>
            <a
              href={whatsappHref}
              className="inline-flex items-center rounded-md border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              Talk on WhatsApp
            </a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {GUEST_POST_PACKAGES.map((pkg) => (
            <article
              key={pkg.key}
              className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md"
            >
              <p className="text-sm uppercase tracking-[0.14em] text-zinc-500">{pkg.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatInr(pkg.priceInr)}
                <span className="ml-2 text-sm font-normal text-zinc-400">/ {formatUsd(pkg.priceUsd)}</span>
              </p>

              <ul className="mt-4 space-y-2">
                {pkg.deliverables.map((item) => (
                  <li key={item} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300">
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={`/guest-post-order?package=${pkg.key}`}
                className="mt-4 inline-flex items-center rounded-md border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                Select {pkg.label}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            What happens after you select a package
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Every guest post request goes through manual editorial review before publication. The review checks
            clarity of narrative, relevance for startup operators and investors, and source quality for factual claims.
            This keeps sponsored coverage useful for readers while protecting overall newsroom trust.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            To align your submission with platform standards, review the
            <Link href="/editorial-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Editorial Policy"}
            </Link>
            , then place details through
            <Link href="/guest-post-order" className="text-indigo-300 hover:text-indigo-200">
              {" the order form"}
            </Link>
            . You can also explore
            <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
              {" published newsroom stories"}
            </Link>
            {" for format reference and quality expectations."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/about-newsroom"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              About Newsroom
            </Link>
            <Link
              href="/methodology"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Methodology
            </Link>
            <Link
              href="/contact-newsroom"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Contact Newsroom
            </Link>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
