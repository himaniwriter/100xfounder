import type { FundingRound } from "@/lib/founders/types";

type FundingInput = {
  fundingInfo: string | null | undefined;
  productSummary: string;
  recentNews: string[];
  sourceUrl: string | null;
};

type HiringInput = {
  fundingInfo: string | null | undefined;
  productSummary: string;
  recentNews: string[];
};

type FundingSummary = {
  fundingTotalDisplay: string | null;
  fundingTotalUsd: number | null;
  lastRound: FundingRound | null;
  allRounds: FundingRound[];
};

const ROUND_LABELS = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D",
  "Series E",
  "Series F",
  "Series G",
  "Growth",
  "Strategic",
  "Debt Financing",
  "Private Equity",
  "IPO",
  "Acquisition",
] as const;

const ROLE_KEYWORDS = [
  "AI Engineer",
  "ML Engineer",
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
  "Data Scientist",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Product Manager",
  "Product Designer",
  "UX Designer",
  "Engineering Manager",
  "Sales Manager",
  "Account Executive",
  "Business Development Manager",
  "Marketing Manager",
  "Recruiter",
] as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseAmountToUsd(text: string): number | null {
  const normalized = text.toLowerCase();
  const usdMatch = normalized.match(/\$\s*([0-9]+(?:\.[0-9]+)?)\s*([kmbt])?/i)
    ?? normalized.match(/usd\s*([0-9]+(?:\.[0-9]+)?)\s*([kmbt])?/i);

  if (usdMatch) {
    const base = Number(usdMatch[1]);
    if (!Number.isFinite(base)) {
      return null;
    }
    const unit = usdMatch[2]?.toLowerCase();
    if (unit === "k") return base * 1_000;
    if (unit === "m") return base * 1_000_000;
    if (unit === "b") return base * 1_000_000_000;
    if (unit === "t") return base * 1_000_000_000_000;
    return base;
  }

  const inrCrMatch = normalized.match(/(?:rs\.?|inr)\s*([0-9]+(?:\.[0-9]+)?)\s*(cr|crore)/i);
  if (inrCrMatch) {
    const crore = Number(inrCrMatch[1]);
    if (!Number.isFinite(crore)) {
      return null;
    }
    const inr = crore * 10_000_000;
    return inr / 83;
  }

  return null;
}

function extractAmountDisplay(text: string): string | null {
  const match = text.match(/(\$\s*[0-9]+(?:\.[0-9]+)?\s*[kmbt]?)/i)
    ?? text.match(/((?:rs\.?|inr)\s*[0-9]+(?:\.[0-9]+)?\s*(?:cr|crore)?)/i);
  return match ? normalizeWhitespace(match[1]) : null;
}

function detectRound(text: string): string {
  const normalized = text.toLowerCase();

  for (const label of ROUND_LABELS) {
    const re = new RegExp(label.replace(/\s+/g, "\\s*"), "i");
    if (re.test(normalized)) {
      return label;
    }
  }

  if (/funding|raised|funded|valuation|capital/.test(normalized)) {
    return "Funding Round";
  }

  return "Undisclosed Round";
}

function extractYear(text: string): string | null {
  const match = text.match(/\b(20[0-9]{2})\b/);
  return match ? match[1] : null;
}

function normalizeRoundKey(round: FundingRound): string {
  return `${round.round.toLowerCase()}::${round.amount.toLowerCase()}::${round.announcedOn ?? ""}`;
}

function toFundingRound(segment: string, sourceUrl: string | null): FundingRound | null {
  const normalized = normalizeWhitespace(segment);
  if (!normalized) {
    return null;
  }

  const amount = extractAmountDisplay(normalized);
  const amountUsd = parseAmountToUsd(normalized);
  const round = detectRound(normalized);

  if (!amount && round === "Undisclosed Round") {
    return null;
  }

  return {
    round,
    amount: amount ?? "Undisclosed",
    amountUsd,
    announcedOn: extractYear(normalized),
    investors: [],
    source: sourceUrl,
  };
}

function formatUsdCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function splitIntoFundingSegments(input: FundingInput): string[] {
  const parts = [input.fundingInfo ?? "", input.productSummary, ...input.recentNews]
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean);

  return parts
    .flatMap((value) => value.split(/[|;]+|\.\s+/))
    .map((segment) => normalizeWhitespace(segment))
    .filter((segment) =>
      /(raised|funding|funded|round|series|seed|valuation|debt|ipo|acquired|capital)/i.test(segment),
    );
}

export function buildFundingSummary(input: FundingInput): FundingSummary {
  const rounds: FundingRound[] = [];
  const seen = new Set<string>();

  splitIntoFundingSegments(input).forEach((segment) => {
    const round = toFundingRound(segment, input.sourceUrl);
    if (!round) {
      return;
    }

    const key = normalizeRoundKey(round);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    rounds.push(round);
  });

  const sorted = [...rounds].sort((a, b) => {
    const aYear = a.announcedOn ? Number(a.announcedOn) : 0;
    const bYear = b.announcedOn ? Number(b.announcedOn) : 0;
    if (aYear !== bYear) {
      return bYear - aYear;
    }

    const aAmount = a.amountUsd ?? 0;
    const bAmount = b.amountUsd ?? 0;
    return bAmount - aAmount;
  });

  const knownAmounts = sorted
    .map((round) => round.amountUsd)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount));

  const total = knownAmounts.length > 0
    ? knownAmounts.reduce((sum, amount) => sum + amount, 0)
    : null;

  return {
    fundingTotalDisplay: total ? formatUsdCompact(total) : null,
    fundingTotalUsd: total,
    lastRound: sorted[0] ?? null,
    allRounds: sorted,
  };
}

export function buildHiringSummary(input: HiringInput): {
  isHiring: boolean;
  hiringRoles: string[];
} {
  const text = normalizeWhitespace(
    [input.productSummary, input.fundingInfo ?? "", ...input.recentNews].join(" "),
  ).toLowerCase();

  const isHiring = /(hiring|open roles|openings|careers|join our team|expanding team|we are hiring|talent)/i.test(text);
  if (!isHiring) {
    return {
      isHiring: false,
      hiringRoles: [],
    };
  }

  const roles = ROLE_KEYWORDS.filter((role) => text.includes(role.toLowerCase()));

  if (roles.length > 0) {
    return {
      isHiring: true,
      hiringRoles: roles,
    };
  }

  if (isHiring) {
    return {
      isHiring: true,
      hiringRoles: ["Multiple roles"],
    };
  }

  return {
    isHiring: true,
    hiringRoles: ["Multiple roles"],
  };
}
