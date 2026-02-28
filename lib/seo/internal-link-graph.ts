import { countryToSlug } from "@/lib/founders/country-tier";
import { slugifySegment } from "@/lib/founders/hubs";

export type InternalLinkNode = {
  href: string;
  label: string;
  reason: string;
};

export type InternalLinkContext = {
  country?: string | null;
  countrySlug?: string | null;
  industry?: string | null;
  industrySlug?: string | null;
  stage?: string | null;
  stageSlug?: string | null;
  fundingRound?: string | null;
  fundingRoundSlug?: string | null;
  topic?: string | null;
  topicSlug?: string | null;
  companySlug?: string | null;
  founderSlug?: string | null;
};

type BuildOptions = {
  maxLinks?: number;
  includeGlobal?: boolean;
};

const GLOBAL_HUB_LINKS: InternalLinkNode[] = [
  {
    href: "/founders",
    label: "Founder directory",
    reason: "Global founder index",
  },
  {
    href: "/startups",
    label: "Startup directory",
    reason: "Programmatic startup listings",
  },
  {
    href: "/countries",
    label: "Countries hub",
    reason: "Geo market coverage",
  },
  {
    href: "/industries",
    label: "Industries hub",
    reason: "Vertical market clusters",
  },
  {
    href: "/stages",
    label: "Startup stages",
    reason: "Stage-based research routes",
  },
  {
    href: "/blog",
    label: "Startup newsroom",
    reason: "Latest analysis and updates",
  },
  {
    href: "/topics",
    label: "Topic hubs",
    reason: "Thematic coverage paths",
  },
  {
    href: "/funding-rounds",
    label: "Funding round news",
    reason: "Stage-based newsroom clusters",
  },
  {
    href: "/startups/jobs",
    label: "Startup jobs",
    reason: "Talent market pages",
  },
  {
    href: "/startups/salary-equity",
    label: "Salary and equity benchmarks",
    reason: "Compensation intelligence",
  },
];

function inferFundingRoundSlug(value?: string | null): string | null {
  const normalized = slugifySegment(value ?? "");
  if (!normalized) {
    return null;
  }

  if (normalized.includes("pre-seed") || normalized === "preseed") {
    return "pre-seed";
  }
  if (normalized.includes("seed")) {
    return "seed";
  }
  if (normalized.includes("series-a")) {
    return "series-a";
  }
  if (normalized.includes("series-b")) {
    return "series-b";
  }
  if (normalized.includes("series-c")) {
    return "series-c";
  }
  if (normalized.includes("series-d")) {
    return "series-d";
  }
  if (normalized.includes("series-e")) {
    return "series-e";
  }
  if (normalized.includes("series-f")) {
    return "series-f";
  }
  if (normalized.includes("series-g")) {
    return "series-g";
  }
  if (normalized.includes("growth")) {
    return "growth";
  }
  if (normalized.includes("strategic")) {
    return "strategic";
  }
  return normalized;
}

function pushUnique(
  links: InternalLinkNode[],
  seen: Set<string>,
  link: InternalLinkNode,
): void {
  if (seen.has(link.href)) {
    return;
  }
  seen.add(link.href);
  links.push(link);
}

export function buildInternalLinkGraph(
  context: InternalLinkContext,
  options: BuildOptions = {},
): InternalLinkNode[] {
  const maxLinks = options.maxLinks ?? 10;
  const includeGlobal = options.includeGlobal ?? false;
  const links: InternalLinkNode[] = [];
  const seen = new Set<string>();

  const countrySlug = context.countrySlug ?? countryToSlug(context.country ?? "");
  const industrySlug = context.industrySlug ?? slugifySegment(context.industry ?? "");
  const stageSlug = context.stageSlug ?? slugifySegment(context.stage ?? "");
  const fundingRoundSlug =
    context.fundingRoundSlug ?? inferFundingRoundSlug(context.fundingRound ?? context.stage);
  const topicSlug = context.topicSlug ?? slugifySegment(context.topic ?? "");

  if (context.companySlug) {
    pushUnique(links, seen, {
      href: `/company/${context.companySlug}`,
      label: "Company profile",
      reason: "Entity detail page",
    });
    pushUnique(links, seen, {
      href: `/companies/${context.companySlug}/news`,
      label: "Company news hub",
      reason: "Entity-specific newsroom coverage",
    });
  }

  if (context.founderSlug) {
    pushUnique(links, seen, {
      href: `/founders/${context.founderSlug}`,
      label: "Founder profile",
      reason: "Founder detail page",
    });
  }

  if (countrySlug) {
    pushUnique(links, seen, {
      href: `/countries/${countrySlug}`,
      label: `${context.country ?? "Country"} startup directory`,
      reason: "Geo-level market coverage",
    });
    pushUnique(links, seen, {
      href: `/countries/${countrySlug}/news`,
      label: `${context.country ?? "Country"} startup news`,
      reason: "Geo newsroom cluster",
    });
    pushUnique(links, seen, {
      href: `/startups/location/${countrySlug}`,
      label: `Startups in ${context.country ?? "this market"}`,
      reason: "Geo startup taxonomy",
    });
  }

  if (industrySlug) {
    pushUnique(links, seen, {
      href: `/industries/${industrySlug}`,
      label: `${context.industry ?? "Industry"} hub`,
      reason: "Industry pillar page",
    });
    pushUnique(links, seen, {
      href: `/startups/industry/${industrySlug}`,
      label: `${context.industry ?? "Industry"} startup list`,
      reason: "Industry taxonomy listing",
    });
  }

  if (stageSlug) {
    pushUnique(links, seen, {
      href: `/stages/${stageSlug}`,
      label: `${context.stage ?? "Stage"} startups`,
      reason: "Stage pillar page",
    });
  }

  if (fundingRoundSlug) {
    pushUnique(links, seen, {
      href: `/startups/funding-round/${fundingRoundSlug}`,
      label: `${context.fundingRound ?? context.stage ?? "Funding"} startup list`,
      reason: "Funding-round taxonomy listing",
    });
    pushUnique(links, seen, {
      href: `/funding-rounds/${fundingRoundSlug}`,
      label: `${context.fundingRound ?? context.stage ?? "Funding"} newsroom`,
      reason: "Funding-round newsroom cluster",
    });
  }

  if (topicSlug) {
    pushUnique(links, seen, {
      href: `/topics/${topicSlug}`,
      label: `${context.topic ?? "Topic"} hub`,
      reason: "Topic-level newsroom route",
    });
  }

  if (countrySlug && industrySlug) {
    pushUnique(links, seen, {
      href: `/countries/${countrySlug}/industries/${industrySlug}`,
      label: `${context.industry ?? "Industry"} startups in ${context.country ?? "this country"}`,
      reason: "Geo + industry listing",
    });
  }

  if (includeGlobal) {
    GLOBAL_HUB_LINKS.forEach((link) => pushUnique(links, seen, link));
  }

  return links.slice(0, maxLinks);
}
