import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { BlogCard } from "@/components/blog/blog-card";
import { NewsletterSubscribeBox } from "@/components/blog/newsletter-subscribe-box";
import { getBlogHomeSections } from "@/lib/blog/store";

type BlogHomePageProps = {
  searchParams?: {
    insight?: string;
  };
};

export const metadata: Metadata = {
  title: "Startup Intelligence Blog | 100Xfounder",
  description:
    "Deep dives on founders, startup funding signals, and market intelligence from 100Xfounder.",
};

export default function BlogHomePage({ searchParams }: BlogHomePageProps) {
  const { featured, trending, recent } = getBlogHomeSections();
  const insight = searchParams?.insight?.trim();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px] sm:px-6 lg:px-8">
        <div>
          <header className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-white">Market Intelligence & Deep Dives</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Founder-level analysis across SaaS, funding, and operator playbooks.
            </p>
            {insight ? (
              <p className="mt-3 text-xs text-indigo-300">
                Highlighted insight: <span className="font-medium">{insight.replace(/-/g, " ")}</span>
              </p>
            ) : null}
          </header>

          {featured ? (
            <div className="grid gap-4 lg:grid-cols-5">
              <BlogCard post={featured} className="h-[420px] lg:col-span-3" />
              <div className="grid gap-4 lg:col-span-2">
                {trending.map((post) => (
                  <BlogCard key={post.slug} post={post} className="h-[132px]" />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-300">
              Recent Articles
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recent.map((post) => (
                <BlogCard key={post.slug} post={post} className="h-[250px]" />
              ))}
            </div>
          </div>
        </div>

        <NewsletterSubscribeBox topic="blog" />
      </section>

      <Footer />
    </main>
  );
}
