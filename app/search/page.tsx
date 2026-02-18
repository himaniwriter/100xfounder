import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SearchPageForm } from "@/components/search/search-page-form";
import { searchSite } from "@/lib/search/service";

type SearchPageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

function toType(value: string | undefined): "all" | "founder" | "company" | "blog" {
  if (value === "founder" || value === "company" || value === "blog") {
    return value;
  }
  return "all";
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = searchParams?.q?.trim() || "";

  if (!q) {
    return {
      title: "Search Founders, Companies, and Blog Posts | 100Xfounder",
      description: "Search 100Xfounder across founder profiles, company pages, and startup intelligence articles.",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `Search results for ${q} | 100Xfounder`,
    description: `Search results for ${q} across founders, companies, and blog posts on 100Xfounder.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const type = toType(searchParams?.type);

  const result = query
    ? await searchSite({
        query,
        type,
        limit: 30,
      })
    : null;

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Search</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Founder, Company, and Blog Search
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Find high-intent startup intelligence in one place.
          </p>
        </header>

        <SearchPageForm initialQuery={query} initialType={type} />

        {!query ? (
          <p className="mt-6 text-sm text-zinc-500">Enter a query to view results.</p>
        ) : (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-zinc-400">
              {result?.total ?? 0} results for <span className="text-zinc-200">{query}</span>
            </p>

            <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Founders</h2>
              <div className="mt-3 space-y-2">
                {result?.results.founders.length ? (
                  result.results.founders.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/founders/${item.slug}`}
                      className="block rounded-md border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/25"
                    >
                      <p className="text-sm font-medium text-white">{item.founderName}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {item.companyName} • {item.industry} • {item.stage}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No founder matches.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Companies</h2>
              <div className="mt-3 space-y-2">
                {result?.results.companies.length ? (
                  result.results.companies.map((item) => (
                    <Link
                      key={item.companySlug}
                      href={`/company/${item.companySlug}`}
                      className="block rounded-md border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/25"
                    >
                      <p className="text-sm font-medium text-white">{item.companyName}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Founder: {item.founderName} • Funding: {item.funding}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No company matches.</p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">Blog Posts</h2>
              <div className="mt-3 space-y-2">
                {result?.results.posts.length ? (
                  result.results.posts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="block rounded-md border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/25"
                    >
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.excerpt}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No blog matches.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
