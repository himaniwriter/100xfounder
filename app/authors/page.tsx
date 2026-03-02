import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getAllBlogPosts } from "@/lib/blog/store";
import { getNewsAuthors } from "@/lib/news/authors";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Newsroom Authors | 100Xfounder",
  description:
    "Meet the 100Xfounder newsroom contributors covering startup funding, founder moves, and market intelligence.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/authors`,
  },
};

export default async function AuthorsPage() {
  const [authors, posts] = await Promise.all([getNewsAuthors(), getAllBlogPosts()]);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Newsroom Authors</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Editorial contributors and analysts behind 100Xfounder newsroom coverage.
        </p>

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Editorial accountability and context</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Author pages help readers understand who is producing coverage and how consistently each topic is tracked.
            Instead of reading stories without context, you can evaluate contributor focus areas across funding, founder
            movement, hiring signals, and market expansion themes.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            For methodology and standards, review
            <Link href="/editorial-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Editorial Policy"}
            </Link>
            , 
            <Link href="/methodology" className="text-indigo-300 hover:text-indigo-200">
              {" Methodology"}
            </Link>
            , and
            <Link href="/corrections-policy" className="text-indigo-300 hover:text-indigo-200">
              {" Corrections Policy"}
            </Link>
            . Then return to
            <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
              {" newsroom stories"}
            </Link>
            {" for the latest published coverage."}
          </p>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {authors.map((author) => {
            const postCount = posts.filter((post) => post.author === author.name).length;
            return (
              <Link
                key={author.slug}
                href={`/authors/${author.slug}`}
                className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md transition-colors hover:border-white/30"
              >
                <p className="text-lg font-medium text-white">{author.name}</p>
                <p className="mt-1 text-sm text-zinc-400">{author.role}</p>
                <p className="mt-3 text-sm text-zinc-300">{author.bio}</p>
                <p className="mt-3 text-xs text-zinc-500">{postCount} published stories</p>
              </Link>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
}
