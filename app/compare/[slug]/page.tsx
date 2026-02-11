import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getFounderDirectory } from "@/lib/founders/store";

type ComparePageProps = {
  params: {
    slug: string;
  };
};

export default async function ComparePage({ params }: ComparePageProps) {
  const [leftSlug, rightSlug] = params.slug.split("-vs-");

  if (!leftSlug || !rightSlug) {
    notFound();
  }

  const founders = await getFounderDirectory();
  const left = founders.find((item) => item.companySlug === leftSlug);
  const right = founders.find((item) => item.companySlug === rightSlug);

  if (!left || !right) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {left.companyName} vs {right.companyName}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Side-by-side founder and growth signal comparison.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-zinc-400">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">{left.companyName}</th>
                <th className="px-4 py-3">{right.companyName}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Founder", left.founderName, right.founderName],
                ["Industry", left.industry, right.industry],
                ["Stage", left.stage, right.stage],
                ["Headquarters", left.headquarters ?? "N/A", right.headquarters ?? "N/A"],
                ["Employee Count", left.employeeCount ?? "N/A", right.employeeCount ?? "N/A"],
                ["Tech Stack", left.techStack.join(", "), right.techStack.join(", ")],
              ].map(([metric, a, b]) => (
                <tr key={String(metric)} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-zinc-400">{metric}</td>
                  <td className="px-4 py-3 text-zinc-200">{a}</td>
                  <td className="px-4 py-3 text-zinc-200">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/company/${left.companySlug}`}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
          >
            Open {left.companyName}
          </Link>
          <Link
            href={`/company/${right.companySlug}`}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
          >
            Open {right.companyName}
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
