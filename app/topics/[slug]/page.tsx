import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { getTopicNewsContext } from "@/lib/news/hubs";

export const revalidate = 21600;
export const dynamic = "force-dynamic";

type TopicNewsPageProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: TopicNewsPageProps): Promise<Metadata> {
  const context = await getTopicNewsContext(params.slug, 80);
  if (!context) {
    return { title: "Topic Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/topics/${context.topic.slug}`;

  return {
    title: `${context.topic.label} Startup News | 100Xfounder Newsroom`,
    description: `Latest ${context.topic.label.toLowerCase()} stories from 100Xfounder newsroom with sources, related coverage, and founder/company context.`,
    alternates: { canonical },
  };
}

export default async function TopicNewsPage({ params }: TopicNewsPageProps) {
  const context = await getTopicNewsContext(params.slug, 120);
  if (!context) {
    notFound();
  }

  const baseUrl = getSiteBaseUrl();
  const topicUrl = `${baseUrl}/topics/${context.topic.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${topicUrl}#webpage`,
        url: topicUrl,
        name: `${context.topic.label} startup news`,
        description: `${context.topic.count} stories in ${context.topic.label}.`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Topics", item: `${baseUrl}/topics` },
          { "@type": "ListItem", position: 3, name: context.topic.label, item: topicUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <Link href="/topics" className="text-xs text-zinc-400 hover:text-zinc-200">
            ← Back to topics
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.topic.label} News
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            {context.topic.count} stories indexed under this topic. Stories include source
            attribution and internal links to relevant founder and company pages.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            {context.items.length > 0 ? (
              context.items.map((post, index) => (
                <BlogCard key={post.slug} post={post} variant={index === 0 ? "hero" : "feed"} />
              ))
            ) : (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6 text-sm text-zinc-400">
                No stories are published for this topic yet.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Topics</p>
              <div className="mt-3 space-y-2">
                {context.relatedTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                  >
                    <p className="text-sm font-medium text-white">{topic.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{topic.count} stories</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trust</p>
              <div className="mt-3 space-y-2 text-sm">
                <Link href="/editorial-policy" className="block text-zinc-300 hover:text-white">
                  Editorial Policy
                </Link>
                <Link href="/corrections-policy" className="block text-zinc-300 hover:text-white">
                  Corrections Policy
                </Link>
                <Link href="/methodology" className="block text-zinc-300 hover:text-white">
                  Methodology
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
