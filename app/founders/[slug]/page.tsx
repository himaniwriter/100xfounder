import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ProfileTabs } from "@/components/founders/profile-tabs";
import { getFounderDirectory } from "@/lib/founders/store";

type FounderProfilePageProps = {
  params: {
    slug: string;
  };
};

export default async function FounderProfilePage({ params }: FounderProfilePageProps) {
  const founders = await getFounderDirectory();
  const founder = founders.find((item) => item.slug === params.slug);

  if (!founder) {
    notFound();
  }

  const similar = founders
    .filter((item) => item.slug !== founder.slug && item.industry === founder.industry)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur-[40px]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
              Verified Profile
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {founder.stage}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
              {founder.industry}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {founder.founderName}
          </h1>
          <p className="mt-2 text-lg text-zinc-300">{founder.companyName}</p>

          <p className="mt-6 text-sm leading-7 text-zinc-300">
            {founder.productSummary}
          </p>

          {founder.fundingInfo ? (
            <p className="mt-4 text-sm leading-7 text-indigo-300">
              {founder.fundingInfo}
            </p>
          ) : null}

          <ProfileTabs founder={founder} similar={similar} />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/founders"
              className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              Back to Directory
            </Link>
            {founder.ycProfileUrl ? (
              <a
                href={founder.ycProfileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
              >
                View on YC Founders
              </a>
            ) : null}
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
            >
              Claim This Profile
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
