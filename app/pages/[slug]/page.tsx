import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { sanitizeRichHtml } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { fetchWordPressPage } from "@/lib/wordpress/client";

export const revalidate = 300;

const baseUrl = getSiteBaseUrl();

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await fetchWordPressPage(params.slug);
  if (!page) {
    return { title: "Page not found | 100xFounder", robots: { index: false } };
  }
  return {
    title: page.seoTitle,
    description: page.seoDescription.slice(0, 160),
    alternates: { canonical: `${baseUrl}/pages/${page.slug}` },
  };
}

/** Pages written in WordPress (the headless CMS) and rendered by the site. */
export default async function WordPressPageRoute({ params }: PageProps) {
  const page = await fetchWordPressPage(params.slug);
  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">{page.title}</h1>
        <div
          className="prose prose-invert mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.content) }}
        />
      </article>
      <Footer />
    </main>
  );
}
