import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  Lightbulb,
  Linkedin,
} from "lucide-react";
import type { CompanyContentExpansion } from "@/lib/company/content-expansion";
import type { FounderDirectoryItem } from "@/lib/founders/types";
import { getUserSubmittedExternalRel } from "@/lib/seo/external-links";
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";

type CompanyDashboardProps = {
  primary: FounderDirectoryItem;
  matches: FounderDirectoryItem[];
  expansion: CompanyContentExpansion;
};

type FounderCard = {
  id: string;
  name: string;
  role: string;
  imageUrl: string | null;
  linkedin: string;
};

function inferTeamSize(value: string | null): string {
  if (!value) {
    return "Not disclosed";
  }

  if (/^\d+$/.test(value)) {
    const count = Number(value);
    if (count < 20) return "1-20 People";
    if (count < 50) return "20-50 People";
    if (count < 100) return "50-100 People";
    if (count < 500) return "100-500 People";
    return "500+ People";
  }

  if (/\+$/.test(value) || /-/i.test(value)) {
    return `${value} People`;
  }

  return value;
}

function marketTags(item: FounderDirectoryItem): string[] {
  const set = new Set<string>();
  if (item.industry) {
    set.add(item.industry);
  }

  const text = `${item.productSummary} ${item.fundingInfo ?? ""}`.toLowerCase();
  if (/\bb2b\b/.test(text)) {
    set.add("B2B");
  }
  if (/\bb2c\b/.test(text) || /consumer/.test(text)) {
    set.add("B2C");
  }
  if (/fintech|payments|lending/.test(text)) {
    set.add("Fintech");
  }
  if (/saas|software/.test(text)) {
    set.add("SaaS");
  }

  return Array.from(set).slice(0, 3);
}

function buildFounders(matches: FounderDirectoryItem[]): FounderCard[] {
  const seen = new Set<string>();
  const founders: FounderCard[] = [];

  matches.forEach((item, index) => {
    const key = item.founderName.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);

    founders.push({
      id: item.id,
      name: item.founderName,
      role: index === 0 ? "Founder & CEO" : index === 1 ? "Co-Founder" : "Founding Team",
      imageUrl: item.avatarUrl,
      linkedin:
        item.linkedinUrl ??
        `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(item.founderName)}`,
    });
  });

  return founders;
}

function aboutMarkdown(item: FounderDirectoryItem): string {
  const lines: string[] = [];

  lines.push(
    `${item.companyName} builds in the ${item.industry.toLowerCase()} category and is tracked by 100Xfounder for operating momentum, talent growth, and market execution.`,
  );

  if (item.productSummary) {
    lines.push(`**What they do:** ${item.productSummary}`);
  }

  if (item.fundingInfo) {
    lines.push(`**Funding context:** ${item.fundingInfo}`);
  }

  if (item.recentNews.length > 0) {
    lines.push("**Recent milestones:**");
    item.recentNews.slice(0, 3).forEach((news) => {
      lines.push(`- ${news}`);
    });
  }

  return lines.join("\n\n");
}

function whyItMatters(item: FounderDirectoryItem): string {
  if (item.fundingInfo) {
    return `${item.companyName} is important right now because it combines execution in ${item.industry.toLowerCase()} with active funding momentum. Teams tracking market leaders should watch this company for hiring activity, product velocity, and partnership expansion.`;
  }

  return `${item.companyName} matters because it is operating in a high-signal ${item.industry.toLowerCase()} segment and showing repeatable execution patterns that investors and operators care about.`;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let keyIndex = 0;

  while (true) {
    match = pattern.exec(text);
    if (!match) {
      break;
    }

    if (match.index > lastIndex) {
      nodes.push(
        <span key={`text-${keyIndex++}`}>
          {text.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={`strong-${keyIndex++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkMatch[2]}
            target="_blank"
            rel={getUserSubmittedExternalRel()}
            className="text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`text-${keyIndex++}`}>
        {text.slice(lastIndex)}
      </span>,
    );
  }

  return nodes;
}

function MarkdownRichText({ markdown }: { markdown: string }) {
  const blocks = markdown
    .split(/\n{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 text-[1.1rem] leading-[1.6] text-zinc-300">
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        if (lines.length > 0 && lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={`list-${index}`} className="list-disc space-y-2 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={`li-${index}-${lineIndex}`}>{parseInline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${index}`}>
            {parseInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}

export function CompanyIntelligenceDashboard({
  primary,
  matches,
  expansion,
}: CompanyDashboardProps) {
  const founders = buildFounders(matches);
  const markets = marketTags(primary);
  const websiteUrl = primary.websiteUrl ?? primary.sourceUrl;
  const locationValue = primary.headquarters ?? "Delhi, India";
  const cityName = locationValue.split(",")[0]?.trim() || locationValue;
  const stageValue = primary.stage || "Undisclosed";
  const description = expansion.aboutMarkdown || aboutMarkdown(primary);
  const whyItMattersText = expansion.whyItMatters || whyItMatters(primary);
  const fundingRounds = primary.allRounds ?? [];
  const hiringRoles = primary.hiringRoles ?? [];

  return (
    <div className="space-y-6">
      <header className="sticky top-16 z-40 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px] shadow-[0_0_24px_rgba(99,102,241,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyLogo
              companyName={primary.companyName}
              websiteUrl={primary.websiteUrl}
              className="h-20 w-20 rounded-2xl border border-white/15"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-semibold tracking-tight text-white">
                  {primary.companyName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {primary.verified ? "Verified" : "Verification Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={websiteUrl}
              target="_blank"
              rel={getUserSubmittedExternalRel()}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
            >
              Visit Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="#meet-founders"
              className="inline-flex h-10 items-center rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Connect with Founders
            </a>
          </div>
        </div>

        <p className="mt-5 max-w-4xl text-xl leading-relaxed text-zinc-100 sm:text-2xl">
          {primary.productSummary}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px] lg:sticky lg:top-[220px]">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Key Facts
          </h2>

          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Location</dt>
              <dd className="mt-1 text-zinc-100">
                <Link
                  href={`/founders?location=${encodeURIComponent(cityName)}`}
                  className="text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  {locationValue}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Team Size</dt>
              <dd className="mt-1 text-zinc-100">{inferTeamSize(primary.employeeCount)}</dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Market</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {markets.length > 0 ? (
                  markets.map((tag) => (
                    <Link
                      key={tag}
                      href={`/founders?industry=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:border-white/25 hover:text-white"
                    >
                      {tag}
                    </Link>
                  ))
                ) : (
                  <span className="text-zinc-400">Not specified</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Stage</dt>
              <dd className="mt-1">
                <Link
                  href={`/founders?stage=${encodeURIComponent(stageValue)}`}
                  className="text-indigo-300 transition-colors hover:text-indigo-200"
                >
                  {stageValue}
                </Link>
              </dd>
            </div>
          </dl>
        </aside>

        <article className="space-y-6">
          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
            <h2 className="text-2xl font-semibold text-white">About {primary.companyName}</h2>
            <div className="mt-4">
              <MarkdownRichText markdown={description} />
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-400/35 bg-indigo-500/10 p-6 backdrop-blur-[40px]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md border border-indigo-300/35 bg-indigo-400/15 p-2 text-indigo-200">
                <Lightbulb className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Why it Matters</h2>
                <p className="mt-2 text-sm leading-7 text-indigo-100/90">{whyItMattersText}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
            <h2 className="text-2xl font-semibold text-white">Funding Snapshot</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-zinc-200">
                Total Funding: {primary.fundingTotalDisplay ?? primary.fundingInfo ?? "Undisclosed"}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-zinc-200">
                Last Round: {primary.lastRound ? `${primary.lastRound.round} ${primary.lastRound.amount}` : "Undisclosed"}
              </span>
              <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-zinc-200">
                All Rounds: {fundingRounds.length}
              </span>
            </div>

            {fundingRounds.length > 0 ? (
              <ul className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                {fundingRounds.slice(0, 8).map((round, index) => (
                  <li key={`${round.round}-${round.amount}-${index}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    {round.round} • {round.amount}
                    {round.announcedOn ? ` • ${round.announcedOn}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
            <h2 className="text-2xl font-semibold text-white">Hiring Roles</h2>
            {primary.isHiring ? (
              <div className="mt-3">
                <p className="text-sm text-emerald-300">This company is actively hiring.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(hiringRoles.length > 0 ? hiringRoles : ["Multiple roles"]).map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">No active hiring signal detected.</p>
            )}
          </section>

          <section id="meet-founders" className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
            <h2 className="text-2xl font-semibold text-white">Meet the Founders</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {founders.map((founder) => (
                <article
                  key={founder.id}
                  className="rounded-xl border border-white/15 bg-black/25 p-4 transition-all hover:border-indigo-400/40 hover:shadow-[0_0_14px_rgba(99,102,241,0.25)]"
                >
                  <div className="flex items-center gap-3">
                    <FounderAvatar
                      name={founder.name}
                      imageUrl={founder.imageUrl}
                      linkedinUrl={founder.linkedin}
                      className="h-12 w-12 rounded-full border border-white/20 bg-black/30"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{founder.name}</p>
                      <p className="text-xs text-zinc-400">{founder.role}</p>
                    </div>
                  </div>

                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel={getUserSubmittedExternalRel()}
                    className="mt-3 inline-flex h-8 items-center gap-1 rounded-md border border-white/15 px-2.5 text-xs text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
            <h2 className="text-2xl font-semibold text-white">Tech Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {(primary.techStack.length > 0
                ? primary.techStack
                : ["React", "Python", "AWS", "Kafka"]
              ).map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-sm text-indigo-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
