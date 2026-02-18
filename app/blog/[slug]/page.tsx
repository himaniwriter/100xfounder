import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCallout } from "@/components/blog/founder-callout";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { extractHeadings, getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog/store";
import { sanitizeRichHtml, serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

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
    const safeHtml = sanitizeRichHtml(content);
    return [
      <div
        key="html-content"
        className="prose prose-invert max-w-none text-[18px] leading-[1.8]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
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
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return { title: "Post Not Found | 100Xfounder" };
  }

  return {
    title: `${post.title} | 100Xfounder Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [post, allPosts] = await Promise.all([
    getBlogPostBySlug(params.slug),
    getAllBlogPosts(),
  ]);
  if (!post) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const hasRahulBajaj = /rahul bajaj/i.test(post.content);
  const relatedReads = allPosts
    .filter((item) => item.slug !== post.slug && item.category === post.category)
    .slice(0, 4);
  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/blog/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        image: post.thumbnail,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: {
          "@type": "Person",
          name: post.author,
        },
        mainEntityOfPage: pageUrl,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${baseUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

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
            {post.sourceUrl ? (
              <p className="mt-3 text-xs text-zinc-400">
                Source:{" "}
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-indigo-300 hover:text-indigo-200"
                >
                  {post.sourceName ?? "Original Publisher"}
                </a>
                {post.sourceTitle ? <span className="text-zinc-500"> · {post.sourceTitle}</span> : null}
              </p>
            ) : null}
          </header>

          <NewsCoverImage
            title={post.title}
            imageUrl={post.thumbnail}
            uniqueId={post.slug}
            className="h-[330px] w-full rounded-2xl border border-white/10"
          />
          {post.imageCredit ? (
            <p className="text-xs italic text-zinc-500">{post.imageCredit}</p>
          ) : null}

          <div className="space-y-5">{renderContent(post.content)}</div>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-base font-semibold text-white">Related Reads</h2>
            <div className="mt-3 space-y-2">
              {relatedReads.length > 0 ? (
                relatedReads.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="block rounded-md border border-white/10 bg-black/25 p-3 transition-colors hover:border-white/25"
                  >
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.excerpt}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No related reads available yet.</p>
              )}
            </div>
          </section>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
    </main>
  );
}
