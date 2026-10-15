import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { formatLaunchDay, getLaunchBySlug, SELECTION_LABELS } from "@/lib/launch/queries";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

const baseUrl = getSiteBaseUrl();

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const launch = await getLaunchBySlug(params.slug);
  if (!launch) {
    return { title: "Launch not found | 100xFounder", robots: { index: false } };
  }
  const hasSpotlight = launch.spotlights.length > 0;
  return {
    title: `${launch.name}: ${launch.tagline} | 100xFounder`,
    description: launch.description?.slice(0, 160) || launch.tagline,
    alternates: { canonical: `${baseUrl}/launches/${launch.slug}` },
    // A tagline-only listing is thin content; index it once the founder story exists.
    robots: { index: hasSpotlight, follow: true },
  };
}

export default async function LaunchPage({ params }: PageProps) {
  const launch = await getLaunchBySlug(params.slug);
  if (!launch) {
    notFound();
  }
  const spotlight = launch.spotlights[0];

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <article className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <Link href="/launches" className="text-sm text-zinc-400 hover:text-white">
          ← All launches
        </Link>
        <div className="mt-6 flex items-start gap-5">
          {launch.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={launch.thumbnailUrl}
              alt={`${launch.name} logo`}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{launch.name}</h1>
            <p className="mt-2 text-lg text-zinc-300">{launch.tagline}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Launched {formatLaunchDay(launch.launchedAt)} · ▲ {launch.votesCount} upvotes
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {launch.selectionReasons.map((reason) => (
            <span key={reason} className="rounded-full border border-indigo-400/30 px-3 py-1 text-xs text-indigo-200">
              {SELECTION_LABELS[reason] ?? reason}
            </span>
          ))}
          {launch.topics.map((topic) => (
            <span key={topic} className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">
              {topic}
            </span>
          ))}
        </div>

        {launch.description ? (
          <p className="mt-8 whitespace-pre-line text-base leading-7 text-zinc-200">{launch.description}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {launch.websiteUrl ? (
            <a
              href={launch.websiteUrl}
              target="_blank"
              rel={spotlight ? "noopener" : "nofollow noopener"}
              className="rounded-lg border border-indigo-400/35 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/20"
            >
              Visit {launch.name}
            </a>
          ) : null}
          <a
            href={launch.sourceUrl}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Spotted on Product Hunt
          </a>
        </div>

        {spotlight ? (
          <section className="mt-12 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Founder spotlight</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Meet {spotlight.founderName}
              {spotlight.role ? `, ${spotlight.role}` : ""}
            </h2>
            <p className="mt-3 line-clamp-3 text-zinc-300">{spotlight.storyOrigin}</p>
            <Link href={`/spotlight/${spotlight.slug}`} className="mt-4 inline-block text-sm text-emerald-200 hover:underline">
              Read the full story →
            </Link>
          </section>
        ) : (
          <section className="mt-12 rounded-2xl border border-white/15 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-white">Are you the founder of {launch.name}?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Get a free founder spotlight on 100xFounder and our Instagram. Check your inbox for an
              invite, or <Link href="/get-featured" className="text-indigo-300 hover:underline">request a feature</Link>.
            </p>
          </section>
        )}
      </article>
      <Footer />
    </main>
  );
}
