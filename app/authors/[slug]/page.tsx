import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getAllBlogPosts } from "@/lib/blog/store";
import { getNewsAuthorBySlug } from "@/lib/news/authors";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const author = await getNewsAuthorBySlug(params.slug);
  if (!author) {
    return { title: "Author Not Found | 100Xfounder" };
  }

  return {
    title: `${author.name} | 100Xfounder Newsroom`,
    description: author.bio,
  };
}

export default async function AuthorDetailPage({ params }: { params: { slug: string } }) {
  const author = await getNewsAuthorBySlug(params.slug);
  if (!author) {
    notFound();
  }

  const posts = (await getAllBlogPosts()).filter((post) => post.author === author.name).slice(0, 50);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/authors" className="text-xs text-zinc-400 hover:text-zinc-200">
          ← Back to authors
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{author.name}</h1>
        <p className="mt-2 text-sm text-zinc-400">{author.role}</p>
        <p className="mt-3 text-sm text-zinc-300">{author.bio}</p>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Recent Stories</h2>
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-white/10 bg-black/30 p-4 transition-colors hover:border-white/25"
              >
                <p className="text-base font-medium text-white">{post.title}</p>
                <p className="mt-2 text-sm text-zinc-400">{post.excerpt}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No stories published under this author yet.</p>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
