import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const pageContent = {
  startups: {
    title: "Startup Explorer",
    description: "Browse high-signal startups built by ambitious founders.",
  },
  signals: {
    title: "Signals",
    description: "Track momentum, funding events, and operator insights.",
  },
  pricing: {
    title: "Pricing",
    description: "Choose a plan that matches your scouting and research workflow.",
  },
  join: {
    title: "Join 100Xfounder",
    description: "Request access to join the premium founder directory.",
  },
  about: {
    title: "About 100Xfounder",
    description: "The premium index for discovering verified startup founders.",
  },
  careers: {
    title: "Careers",
    description: "Help us build the most trusted founder intelligence platform.",
  },
  contact: {
    title: "Contact",
    description: "Reach the 100Xfounder team for partnerships and support.",
  },
  blog: {
    title: "Blog",
    description: "Insights and analysis on founders, startups, and venture trends.",
  },
  help: {
    title: "Help Center",
    description: "Get support articles and product guidance.",
  },
  changelog: {
    title: "Changelog",
    description: "Product improvements and releases from the 100Xfounder team.",
  },
  privacy: {
    title: "Privacy",
    description: "How 100Xfounder handles and protects your data.",
  },
  terms: {
    title: "Terms",
    description: "Rules and terms for using the 100Xfounder platform.",
  },
  cookies: {
    title: "Cookies",
    description: "Cookie and tracking preferences for the platform.",
  },
} as const;

type ContentKey = keyof typeof pageContent;

function isContentKey(value: string): value is ContentKey {
  return value in pageContent;
}

export default function MarketingPage({
  params,
}: {
  params: { page: string };
}) {
  if (!isContentKey(params.page)) {
    notFound();
  }

  const content = pageContent[params.page];

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">{content.description}</p>
        <div className="mt-8">
          <Link
            href="/founders"
            className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
          >
            Open Founder Directory
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
