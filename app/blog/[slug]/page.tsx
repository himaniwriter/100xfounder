import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BackToTopButton } from "@/components/BackToTopButton";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { SocialShareBar } from "@/components/SocialShareBar";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ArticleToc } from "@/components/blog/article-toc";
import { FeaturedWidgetAttention } from "@/components/blog/featured-widget-attention";
import { FounderCallout } from "@/components/blog/founder-callout";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { GetFeaturedCtaCard } from "@/components/shared/get-featured-cta-card";
import { Badge } from "@/components/ui/badge";
import { NewsCoverImage } from "@/components/ui/news-cover-image";
import { getAllBlogPostsWithOptions, getBlogPostBySlug } from "@/lib/blog/store";
import { addHeadingIds, extractHeadings } from "@/lib/addHeadingIds";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import { countryToSlug } from "@/lib/founders/country-tier";
import { getFounderDirectory } from "@/lib/founders/store";
import { sanitizeRichHtml, serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { findFirstActiveRedirectTarget } from "@/lib/url-redirects";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    preview?: string;
  };
};

function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

function formatMetaDate(value?: string): string {
  if (!value) {
    return "Latest";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Latest";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatFactCheckStatus(value: string | undefined): string {
  if (!value) {
    return "Pending review";
  }

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderContent(content: string) {
  if (isHtmlContent(content)) {
    const safeHtml = sanitizeRichHtml(content);
    return [
      <div
        key="html-content"
        className="prose prose-invert max-w-none prose-p:my-5 prose-p:text-[18px] prose-p:leading-[1.8] prose-headings:tracking-tight prose-headings:text-white prose-headings:font-semibold prose-h1:text-[2rem] prose-h1:font-bold prose-h1:mt-10 prose-h1:mb-5 prose-h2:text-[1.6rem] prose-h2:mt-9 prose-h2:mb-4 prose-h3:text-[1.3rem] prose-h3:mt-8 prose-h3:mb-3 prose-h4:text-[1.1rem] prose-h4:mt-7 prose-h4:mb-3 prose-li:my-1 prose-li:text-zinc-300 prose-ul:my-6 prose-ol:my-6 prose-a:text-indigo-300 hover:prose-a:text-indigo-200 prose-a:underline-offset-2 prose-strong:text-zinc-100 prose-blockquote:border-l-indigo-400/40 prose-blockquote:text-zinc-200 prose-code:bg-white/[0.06] prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-zinc-200 prose-pre:rounded-xl prose-pre:border prose-pre:border-white/8"
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
        <h2 id={headingSlug(text)} key={`h2-${index}`} className="mt-12 text-[1.6rem] font-semibold tracking-tight text-white">
          {text}
        </h2>,
      );
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      const text = line.slice(2).trim();
      nodes.push(
        <h1 id={headingSlug(text)} key={`h1-${index}`} className="mt-14 text-[2rem] font-bold tracking-tight text-white">
          {text}
        </h1>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      const text = line.slice(4).trim();
      nodes.push(
        <h3 id={headingSlug(text)} key={`h3-${index}`} className="mt-10 text-[1.3rem] font-semibold text-zinc-100">
          {text}
        </h3>,
      );
      return;
    }

    if (line.startsWith("#### ")) {
      flushList();
      const text = line.slice(5).trim();
      nodes.push(
        <h4 id={headingSlug(text)} key={`h4-${index}`} className="mt-8 text-[1.1rem] font-medium text-zinc-100">
          {text}
        </h4>,
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
  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/blog/${post.slug}`;

  return {
    title: `${post.seoTitle ?? post.title} | 100Xfounder Newsroom`,
    description: post.seoDescription ?? post.excerpt,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      type: "article",
      url: canonical,
      images: [
        {
          url: post.thumbnail,
          alt: post.title,
        },
      ],
    },
  };
}

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const previewRequested =
    searchParams?.preview === "1" || searchParams?.preview === "true";

  if (previewRequested) {
    await requireAdminPage();
  }

  const [post, allPosts, founders] = await Promise.all([
    getBlogPostBySlug(params.slug, { includeDrafts: previewRequested }),
    getAllBlogPostsWithOptions({ includeDrafts: previewRequested }),
    getFounderDirectory({ perCountryLimit: 500 }),
  ]);
  if (!post) {
    const redirectTarget = await findFirstActiveRedirectTarget([
      `/blog/${params.slug}`,
      `/newsroom/${params.slug}`,
    ]);
    if (redirectTarget) {
      permanentRedirect(redirectTarget);
    }
    notFound();
  }

  const contentWithHeadingIds = addHeadingIds(post.content);
  const headings = extractHeadings(contentWithHeadingIds);
  const hasRahulBajaj = /rahul bajaj/i.test(post.content);
  const topicSlug = post.topicSlug || headingSlug(post.category || "news");
  const authorProfileSlug = authorSlug(post.author);
  const authorHref = `/authors/${authorProfileSlug}`;
  const relatedReads = allPosts
    .filter((item) => item.slug !== post.slug && item.category === post.category)
    .slice(0, 4);
  const matchedCompany = founders.find((item) =>
    `${post.title} ${post.excerpt}`.toLowerCase().includes(item.companyName.toLowerCase()),
  );
  const relatedCoverageCandidates = [
    {
      href: `/topics/${topicSlug}`,
      label: `${post.category || "News"} Topic Hub`,
    },
    matchedCompany
      ? {
        href: `/companies/${matchedCompany.companySlug}/news`,
        label: `${matchedCompany.companyName} News Hub`,
      }
      : null,
    matchedCompany
      ? {
        href: `/countries/${countryToSlug(matchedCompany.country ?? "India")}/news`,
        label: `${matchedCompany.country ?? "Country"} Startup News`,
      }
      : null,
    /seed|series|growth|late stage|pre-seed|strategic/i.test(
      `${post.title} ${post.excerpt} ${post.content}`,
    )
      ? {
        href: "/funding-rounds",
        label: "Funding Round News Hubs",
      }
      : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));
  const relatedCoverage = Array.from(
    new Map(relatedCoverageCandidates.map((item) => [item.href, item])).values(),
  ).slice(0, 4);
  const citationItems = Array.from(
    new Map(
      [
        ...(post.citations ?? []).map((citation) => ({
          sourceName: citation.sourceName,
          sourceTitle: citation.sourceTitle,
          sourceUrl: citation.sourceUrl,
          quotedClaim: citation.quotedClaim ?? null,
        })),
        ...(post.sourceUrls ?? []).map((sourceUrl) => ({
          sourceName: "Referenced Source",
          sourceTitle: sourceUrl,
          sourceUrl,
          quotedClaim: null,
        })),
      ].map((item) => [item.sourceUrl, item]),
    ).values(),
  );
  const factCheckStatus = formatFactCheckStatus(post.factCheckStatus);
  const factChecked = ["reviewed", "verified", "approved"].includes(
    (post.factCheckStatus || "").toLowerCase(),
  );
  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/blog/${post.slug}`;
  const publishedDate = post.publishedAt;
  const updatedDate = post.updatedAt ?? post.publishedAt;
  const faqSchema = post.faqSchema && typeof post.faqSchema === "object" ? post.faqSchema : null;
  const howtoSchema =
    post.howtoSchema && typeof post.howtoSchema === "object" ? post.howtoSchema : null;
  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${pageUrl}#article`,
        headline: post.title,
        alternativeHeadline: post.subtitle || undefined,
        description: post.excerpt,
        articleSection: post.category,
        image: [post.socialImageUrl, post.thumbnail].filter(Boolean),
        datePublished: publishedDate,
        dateModified: updatedDate,
        isAccessibleForFree: true,
        citation: citationItems.map((item) => item.sourceUrl),
        author: {
          "@type": "Person",
          name: post.author,
          url: `${baseUrl}${authorHref}`,
        },
        publisher: {
          "@type": "Organization",
          name: "100Xfounder",
          url: baseUrl,
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/favicon.ico`,
          },
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
            name: "Newsroom",
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
    <main className="min-h-screen bg-[#050505] text-zinc-100">
      <ReadingProgressBar />
      <Navbar />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[200px_minmax(0,720px)_240px] sm:px-6 lg:px-8">
        {/* Left sidebar — TOC */}
        <aside className="hidden lg:block">
          <ArticleToc headings={headings} mode="desktop" />
        </aside>

        {/* Article content */}
        <article className="min-w-0 space-y-8">
          <ArticleToc headings={headings} mode="mobile" />

          {/* Article header */}
          <header className="space-y-4">
            <Link href="/blog" className="inline-flex items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300">
              ← Back to newsroom
            </Link>

            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
              {post.title}
            </h1>

            {post.subtitle ? (
              <p className="text-lg leading-relaxed text-zinc-400">{post.subtitle}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5 text-sm text-zinc-500">
              <Badge>{post.category}</Badge>
              {previewRequested && post.status === "DRAFT" ? (
                <Badge variant="warning">Draft Preview</Badge>
              ) : null}
              <span>{post.readingTime}</span>
              <span className="text-zinc-600">·</span>
              <span>
                By{" "}
                <Link href={authorHref} className="text-zinc-300 transition-colors hover:text-white">
                  {post.author}
                </Link>
              </span>
              <span className="text-zinc-600">·</span>
              <span>{formatMetaDate(publishedDate)}</span>
            </div>

            {post.sourceUrl ? (
              <p className="text-[13px] text-zinc-500">
                Source:{" "}
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-indigo-300/80 transition-colors hover:text-indigo-200"
                >
                  {post.sourceName ?? "Original Publisher"}
                </a>
                {post.sourceTitle ? <span className="text-zinc-600"> · {post.sourceTitle}</span> : null}
              </p>
            ) : null}

            <SocialShareBar url={pageUrl} title={post.title} description={post.excerpt} />
          </header>

          <div className="relative isolate w-full pt-4 pb-12 sm:pb-16 lg:pb-24">
            {/* Hero image base */}
            <NewsCoverImage
              title={post.title}
              imageUrl={post.thumbnail}
              uniqueId={post.slug}
              className="h-[320px] w-full rounded-2xl border border-white/8 object-cover sm:h-[400px] lg:h-[480px]"
              priority
            />
            {post.imageCredit ? (
              <p className="absolute bottom-2 right-4 z-10 text-xs italic text-white/60 drop-shadow-md">
                {post.imageCredit}
              </p>
            ) : null}

            {/* Overlapping Glass Card (Why this matters) */}
            <div className="relative -mt-16 ml-4 w-[calc(100%-2rem)] sm:-mt-24 sm:ml-8 sm:w-[90%] md:w-[80%] lg:-mt-32 lg:ml-10 lg:w-[70%] z-20">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
                {/* Subtle gradient overlay to enhance readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70 sm:text-sm">
                    Why this matters
                  </h2>
                  <p className="mt-3 text-[15px] leading-[1.8] text-white/95 sm:text-[17px]">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fact-check */}
          <section className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
              {factChecked ? (
                <span className="text-xs text-emerald-400">✓</span>
              ) : (
                <span className="text-xs text-zinc-500">?</span>
              )}
            </div>
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Fact-check: {factCheckStatus}
              </h2>
              <p className="mt-1 text-[13px] text-zinc-500">
                {factChecked ? "Verified by newsroom review workflow." : "Pending final verification."}
              </p>
              {post.correctionNote ? (
                <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-500/5 p-2.5 text-xs text-amber-200/80">
                  Correction: {post.correctionNote}
                </p>
              ) : null}
            </div>
          </section>

          {/* Article body */}
          <div id="article-content" className="space-y-6">{renderContent(contentWithHeadingIds)}</div>

          {/* Sources & Citations */}
          <section className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Sources & Citations</h2>
            <div className="mt-4 space-y-2">
              {citationItems.length > 0 ? (
                citationItems.map((item) => (
                  <div
                    key={item.sourceUrl}
                    className="rounded-lg border border-white/6 bg-white/[0.02] p-3"
                  >
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm font-medium text-indigo-300/80 transition-colors hover:text-indigo-200"
                    >
                      {item.sourceName}
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">{item.sourceTitle}</p>
                    {item.quotedClaim ? (
                      <p className="mt-1.5 text-xs text-zinc-400">Claim referenced: {item.quotedClaim}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No citations attached yet.</p>
              )}
            </div>
          </section>

          {/* Update log (preview only) */}
          {previewRequested && post.updates && post.updates.length > 0 ? (
            <section className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Update Log</h2>
              <div className="mt-3 space-y-2">
                {post.updates.slice(0, 5).map((update) => (
                  <div
                    key={`${update.changeType}-${update.createdAt ?? "now"}`}
                    className="rounded-lg border border-white/6 bg-white/[0.02] p-3"
                  >
                    <p className="text-sm font-medium text-zinc-200">{formatFactCheckStatus(update.changeType)}</p>
                    {update.note ? <p className="mt-1 text-xs text-zinc-500">{update.note}</p> : null}
                    {update.createdAt ? (
                      <p className="mt-1 text-xs text-zinc-600">Updated: {formatMetaDate(update.createdAt)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Related Coverage */}
          <section className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Related Coverage</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {relatedCoverage.length > 0 ? (
                relatedCoverage.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg border border-white/6 bg-white/[0.02] p-3 text-sm text-zinc-300 transition-all duration-150 hover:border-white/16 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No related coverage clusters yet.</p>
              )}
            </div>
          </section>

          <PillarCrosslinks
            context={{
              topicSlug,
              country: matchedCompany?.country,
              industry: matchedCompany?.industry,
              stage: matchedCompany?.stage,
              companySlug: matchedCompany?.companySlug,
              founderSlug: matchedCompany?.slug,
            }}
            includeGlobal
            maxLinks={10}
            title="Contextual Internal Links"
            description="Explore pillar and category pages connected to this article for deeper startup research."
          />

          {/* Share again */}
          <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <h2 className="text-sm font-medium text-zinc-300">Found this useful? Share it.</h2>
            <SocialShareBar
              url={pageUrl}
              title={post.title}
              description={post.excerpt}
              showFloatingMobile
            />
          </section>

          {/* Related Reads */}
          <section className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Related Reads</h2>
            <div className="mt-3 space-y-2">
              {relatedReads.length > 0 ? (
                relatedReads.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="block rounded-lg border border-white/6 bg-white/[0.02] p-3 transition-all duration-150 hover:border-white/16"
                  >
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{item.excerpt}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No related reads available yet.</p>
              )}
            </div>
          </section>
        </article>

        {/* Right sidebar */}
        <aside className="relative space-y-4">
          <div
            id="featured-widget"
            className="featured-widget-transition lg:sticky lg:top-24 lg:z-30"
          >
            <GetFeaturedCtaCard
              context="blog_post"
              description="Own the narrative for your startup with a verified featured profile."
            />
          </div>
          {hasRahulBajaj ? (
            <div className="relative z-10">
              <FounderCallout
                founderName="Rahul Bajaj Group"
                founderSlug="rahul-bajaj-group-bajaj-finance-ltd-1"
                companyName="Bajaj Finance Ltd"
              />
            </div>
          ) : null}
        </aside>
      </section>

      <FeaturedWidgetAttention />
      <BackToTopButton />
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
        />
      ) : null}
      {howtoSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(howtoSchema) }}
        />
      ) : null}
    </main>
  );
}
