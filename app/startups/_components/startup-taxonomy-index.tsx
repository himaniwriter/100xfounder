import Link from "next/link";
import type { StartupTaxonomyOption } from "@/lib/startups/catalog";

type StartupTaxonomyIndexProps = {
  heading: string;
  description: string;
  options: StartupTaxonomyOption[];
  hrefPrefix: string;
};

export function StartupTaxonomyIndex({
  heading,
  description,
  options,
  hrefPrefix,
}: StartupTaxonomyIndexProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Startup Taxonomy</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{heading}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{description}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((item) => (
          <Link
            key={item.slug}
            href={`${hrefPrefix}/${item.slug}`}
            className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px] transition-all hover:border-white/30 hover:shadow-[0_0_18px_rgba(99,102,241,0.2)]"
          >
            <p className="text-lg font-semibold text-white">{item.label}</p>
            <p className="mt-2 text-sm text-zinc-400">{item.count} companies tracked</p>
            <p className="mt-3 text-xs uppercase tracking-[0.15em] text-indigo-300">Open SEO page</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
