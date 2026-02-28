import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";
import { getFounderDirectory } from "@/lib/founders/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

type ComparePageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  const [leftSlug, rightSlug] = params.slug.split("-vs-");
  const baseUrl = getSiteBaseUrl();

  if (!leftSlug || !rightSlug) {
    return {
      title: "Startup Comparison | 100Xfounder",
      description: "Compare startup companies and founders side by side.",
      alternates: {
        canonical: `${baseUrl}/compare/${params.slug}`,
      },
    };
  }

  const founders = await getFounderDirectory({ limit: 2000 });
  const left = founders.find((item) => item.companySlug === leftSlug);
  const right = founders.find((item) => item.companySlug === rightSlug);
  const pairLabel =
    left && right ? `${left.companyName} vs ${right.companyName}` : "Startup Comparison";

  return {
    title: `${pairLabel} | 100Xfounder`,
    description:
      left && right
        ? `Compare ${left.companyName} and ${right.companyName} across founder profile, funding, hiring, and growth signals.`
        : "Compare startup companies and founders side by side.",
    alternates: {
      canonical: `${baseUrl}/compare/${params.slug}`,
    },
  };
}

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

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[left, right].map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-[30px]"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0">
                  <CompanyLogo
                    companyName={item.companyName}
                    imageUrl={item.avatarUrl}
                    websiteUrl={item.websiteUrl}
                    className="h-12 w-12 rounded-xl border border-white/20"
                  />
                  <FounderAvatar
                    name={item.founderName}
                    imageUrl={item.avatarUrl}
                    linkedinUrl={item.linkedinUrl}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border border-white/25 bg-black/30"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{item.companyName}</p>
                  <p className="truncate text-sm text-zinc-400">{item.founderName}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

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
                ["Country", left.country ?? "Unknown", right.country ?? "Unknown"],
                [
                  "Total Funding",
                  left.fundingTotalDisplay ?? left.fundingInfo ?? "Undisclosed",
                  right.fundingTotalDisplay ?? right.fundingInfo ?? "Undisclosed",
                ],
                [
                  "Last Round",
                  left.lastRound ? `${left.lastRound.round} ${left.lastRound.amount}` : "Undisclosed",
                  right.lastRound ? `${right.lastRound.round} ${right.lastRound.amount}` : "Undisclosed",
                ],
                [
                  "Hiring Roles",
                  left.isHiring
                    ? left.hiringRoles && left.hiringRoles.length > 0
                      ? left.hiringRoles.slice(0, 3).join(", ")
                      : "Hiring now"
                    : "No active signal",
                  right.isHiring
                    ? right.hiringRoles && right.hiringRoles.length > 0
                      ? right.hiringRoles.slice(0, 3).join(", ")
                      : "Hiring now"
                    : "No active signal",
                ],
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
