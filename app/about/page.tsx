import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getSiteBaseUrl } from "@/lib/sitemap";

const baseUrl = getSiteBaseUrl();

export const metadata: Metadata = {
  title: "About 100Xfounder | Founder Intelligence and Startup News",
  description:
    "100Xfounder tracks founder news, funding rounds, hiring signals, and startup intelligence so readers can get decision-ready context in one place.",
  alternates: {
    canonical: `${baseUrl}/about`,
  },
  openGraph: {
    title: "About 100Xfounder",
    description:
      "Founder-related news, funding updates, and startup intelligence built for operators, investors, and growth teams.",
    url: `${baseUrl}/about`,
    type: "website",
  },
};

const missionPoints = [
  "Make founder and startup intelligence easy to discover, verify, and use.",
  "Reduce research time by combining founder context, company signals, and newsroom coverage in one platform.",
  "Help readers move from scattered information to clear, action-ready decisions.",
];

const visionPoints = [
  "Build the most trusted founder and startup intelligence layer for India and US markets.",
  "Become the default reference surface for founder stories, funding movement, and hiring momentum.",
  "Enable every user to evaluate startup opportunities without jumping across multiple websites.",
];

const coveragePillars = [
  {
    title: "Founder News",
    description:
      "Leadership updates, founder moves, and company-building stories with contextual links to founder and company pages.",
    href: "/blog",
    cta: "Open Blog",
  },
  {
    title: "Funding News",
    description:
      "Round-by-round capital movement with market context, stage mapping, and related startup coverage.",
    href: "/funding-rounds",
    cta: "Open Funding News",
  },
  {
    title: "Signals and Hiring",
    description:
      "Fresh operating signals and hiring momentum to understand where startup activity is increasing.",
    href: "/signals",
    cta: "Open Signals",
  },
];

const quickPaths = [
  { label: "Founder Directory", href: "/founders" },
  { label: "Startup Explorer", href: "/startups" },
  { label: "News Topics", href: "/topics" },
  { label: "Country Coverage", href: "/countries" },
  { label: "Editorial Policy", href: "/editorial-policy" },
  { label: "Methodology", href: "/methodology" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">About 100Xfounder</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Founder intelligence, funding news, and startup signals in one platform.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-zinc-300 sm:text-lg">
          100Xfounder is built for founders, investors, operators, and researchers who need
          reliable startup context quickly. We combine founder-related coverage, funding updates,
          and market signals so users can understand what is happening and why it matters.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
            <h2 className="text-sm uppercase tracking-[0.18em] text-zinc-400">Mission</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200 sm:text-base">
              {missionPoints.map((point) => (
                <li key={point} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
            <h2 className="text-sm uppercase tracking-[0.18em] text-zinc-400">Vision</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200 sm:text-base">
              {visionPoints.map((point) => (
                <li key={point} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-10 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">What We Highlight Every Day</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400 sm:text-base">
            The core of 100Xfounder is daily coverage and structured intelligence across founders,
            funding, and company momentum.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {coveragePillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-xl border border-white/12 bg-black/30 p-4"
              >
                <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{pillar.description}</p>
                <Link
                  href={pillar.href}
                  className="mt-4 inline-flex rounded-lg border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/20"
                >
                  {pillar.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/15 bg-black/25 p-6">
          <h2 className="text-xl font-semibold text-white">Explore 100Xfounder</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickPaths.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
          <h2 className="text-xl font-semibold text-white">How we connect news to intelligence</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            100Xfounder is structured as a connected research surface. A user can start with a funding or founder
            story, open the linked company profile, compare similar entities by stage or industry, and then validate
            movement across country pages. This internal route design is intentional: it helps users move from
            headline-level information to decision-level context without switching platforms.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Our editorial and data layers work together. Newsroom pages prioritize source-attributed clarity, while
            profile and taxonomy pages organize structured details such as stage, funding progression, and hiring
            momentum. If you want to understand how a startup market is changing, this combination is more useful
            than reading single articles in isolation.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            To review how coverage decisions are made, see
            <Link href="/about-newsroom" className="text-indigo-300 hover:text-indigo-200">
              {" About Newsroom"}
            </Link>
            , 
            <Link href="/editorial-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Editorial Policy"}
            </Link>
            , and
            <Link href="/methodology" className="text-indigo-300 hover:text-indigo-200">
              {" Methodology"}
            </Link>
            . For fast research starts, go directly to
            <Link href="/founders" className="text-indigo-300 hover:text-indigo-200">
              {" Founder Directory"}
            </Link>
            {" or "}
            <Link href="/startups" className="text-indigo-300 hover:text-indigo-200">
              {"Startup Explorer"}
            </Link>
            .
          </p>
        </section>
      </section>
      <Footer />
    </main>
  );
}
