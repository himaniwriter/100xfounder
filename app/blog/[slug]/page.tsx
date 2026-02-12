import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCallout } from "@/components/blog/founder-callout";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { extractHeadings, getBlogPostBySlug } from "@/lib/blog/store";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function renderContent(content: string) {
  if (isHtmlContent(content)) {
    return [
      <div
        key="html-content"
        className="prose prose-invert max-w-none text-[18px] leading-[1.8]"
        dangerouslySetInnerHTML={{ __html: content }}
      />,
    ];
  }

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];

  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc space-y-2 pl-6 text-[18px] leading-[1.8] text-zinc-300">
        {listItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      const text = line.slice(3).trim();
      nodes.push(
        <h2 id={headingSlug(text)} key={`h2-${index}`} className="mt-9 text-2xl font-semibold tracking-tight text-white">
          {text}
        </h2>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      const text = line.slice(4).trim();
      nodes.push(
        <h3 id={headingSlug(text)} key={`h3-${index}`} className="mt-7 text-xl font-medium text-zinc-100">
          {text}
        </h3>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2).trim());
      return;
    }

    flushList();
    nodes.push(
      <p key={`p-${index}`} className="text-[18px] leading-[1.8] text-zinc-300">
        {line}
      </p>,
    );
  });

  flushList();
  return nodes;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: "Post Not Found | 100Xfounder" };
  }

  return {
    title: `${post.title} | 100Xfounder Blog`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const hasRahulBajaj = /rahul bajaj/i.test(post.content);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[220px_minmax(0,700px)_260px] sm:px-6 lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Table of Contents</p>
            <ul className="mt-3 space-y-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    className={
                      heading.level === 3
                        ? "block pl-3 text-xs text-zinc-400 hover:text-white"
                        : "block text-sm text-zinc-300 hover:text-white"
                    }
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="space-y-6">
          <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
            <Link href="/blog" className="text-xs text-zinc-400 hover:text-zinc-200">
              ← Back to blog
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{post.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
                {post.category}
              </span>
              <span>{post.readingTime}</span>
              <span>{post.author}</span>
            </div>
          </header>

          <NewsCoverImage
            title={post.title}
            imageUrl={post.thumbnail}
            uniqueId={post.slug}
            className="h-[330px] w-full rounded-2xl border border-white/10"
          />

          <div className="space-y-5">{renderContent(post.content)}</div>
        </article>

        <aside className="space-y-4">
          {hasRahulBajaj ? (
            <div className="sticky top-24">
              <FounderCallout
                founderName="Rahul Bajaj Group"
                founderSlug="rahul-bajaj-group-bajaj-finance-ltd-1"
                companyName="Bajaj Finance Ltd"
              />
            </div>
          ) : null}
        </aside>
      </section>

      <Footer />
    </main>
  );
}
