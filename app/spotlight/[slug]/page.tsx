import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getSpotlightBySlug } from "@/lib/launch/queries";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

const baseUrl = getSiteBaseUrl();

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const spotlight = await getSpotlightBySlug(params.slug);
  if (!spotlight) {
    return { title: "Spotlight not found | 100xFounder", robots: { index: false } };
  }
  const title = `${spotlight.founderName} on building ${spotlight.product.name} | 100xFounder`;
  const description = `${spotlight.product.name}: ${spotlight.product.tagline}. ${spotlight.founderName} shares why they built it.`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `${baseUrl}/spotlight/${spotlight.slug}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/spotlight/${spotlight.slug}`,
      type: "article",
      images: [`${baseUrl}/api/instagram/slide?spotlight=${spotlight.id}&slide=0`],
    },
  };
}

export default async function SpotlightPage({ params }: PageProps) {
  const spotlight = await getSpotlightBySlug(params.slug);
  if (!spotlight) {
    notFound();
  }

  const sections: Array<[string, string | null]> = [
    [`Why ${spotlight.product.name}?`, spotlight.storyOrigin],
    ["The problem it solves", spotlight.storyProblem],
    ["Traction so far", spotlight.storyTraction],
    ["Advice for other founders", spotlight.storyAdvice],
    ["What's next", spotlight.storyNext],
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${spotlight.founderName} on building ${spotlight.product.name}`,
    datePublished: spotlight.publishedAt?.toISOString(),
    about: { "@type": "Organization", name: spotlight.product.name, url: spotlight.product.websiteUrl ?? undefined },
    author: { "@type": "Organization", name: "100xFounder", url: baseUrl },
    mentions: { "@type": "Person", name: spotlight.founderName, jobTitle: spotlight.role ?? undefined },
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Link href="/spotlight" className="text-sm text-zinc-400 hover:text-white">
          ← All spotlights
        </Link>
        <header className="mt-6 flex items-center gap-5">
          {spotlight.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={spotlight.photoUrl} alt={spotlight.founderName} className="h-24 w-24 rounded-full object-cover" />
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Founder spotlight</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {spotlight.founderName} on building {spotlight.product.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {[spotlight.role, spotlight.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </header>

        <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-zinc-200">
          <Link href={`/launches/${spotlight.product.slug}`} className="font-semibold text-white hover:underline">
            {spotlight.product.name}
          </Link>
          : {spotlight.product.tagline}
        </p>

        {sections
          .filter((section): section is [string, string] => Boolean(section[1]))
          .map(([heading, body]) => (
            <section key={heading} className="mt-10">
              <h2 className="text-xl font-semibold text-white">{heading}</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-7 text-zinc-200">{body}</p>
            </section>
          ))}

        <div className="mt-12 flex flex-wrap gap-3">
          {spotlight.product.websiteUrl ? (
            <a
              href={spotlight.product.websiteUrl}
              target="_blank"
              rel="noopener"
              className="rounded-lg border border-indigo-400/35 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/20"
            >
              Visit {spotlight.product.name}
            </a>
          ) : null}
          {spotlight.twitterUrl ? (
            <a href={spotlight.twitterUrl} target="_blank" rel="nofollow noopener" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
              X / Twitter
            </a>
          ) : null}
          {spotlight.linkedinUrl ? (
            <a href={spotlight.linkedinUrl} target="_blank" rel="nofollow noopener" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">
              LinkedIn
            </a>
          ) : null}
        </div>
      </article>
      <Footer />
    </main>
  );
}
