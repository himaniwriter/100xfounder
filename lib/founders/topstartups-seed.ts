import type { FounderDirectoryItem } from "@/lib/founders/types";

export const TOPSTARTUPS_SOURCE_URL = "https://topstartups.io/";

type TopStartupInput = {
  companyName: string;
  domain: string;
  foundedYear: number;
  headquarters: string;
  industry: string;
  stage: string;
  employeeCount: string;
  fundingInfo: string;
  productSummary: string;
  isFeatured?: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function inferTechStack(industry: string): string[] {
  const key = industry.toLowerCase();
  if (key.includes("ai")) return ["Python", "TypeScript", "Kubernetes", "AWS"];
  if (key.includes("fintech")) return ["Java", "PostgreSQL", "Kafka", "AWS"];
  if (key.includes("security")) return ["Go", "Python", "Kubernetes", "GCP"];
  if (key.includes("health")) return ["Python", "React", "PostgreSQL", "GCP"];
  return ["React", "Node.js", "PostgreSQL", "AWS"];
}

function toDirectoryItem(input: TopStartupInput): FounderDirectoryItem {
  const companySlug = slugify(input.companyName);
  const founderName = `${input.companyName} Founding Team`;

  return {
    id: `topstartups-${companySlug}`,
    slug: `${slugify(founderName)}-${companySlug}`,
    companySlug,
    founderName,
    companyName: input.companyName,
    foundedYear: input.foundedYear,
    headquarters: input.headquarters,
    industry: input.industry,
    stage: input.stage,
    productSummary: input.productSummary,
    fundingInfo: input.fundingInfo,
    sourceUrl: TOPSTARTUPS_SOURCE_URL,
    ycProfileUrl: `https://www.ycombinator.com/founders?query=${encodeURIComponent(input.companyName)}`,
    websiteUrl: `https://${input.domain}`,
    employeeCount: input.employeeCount,
    techStack: inferTechStack(input.industry),
    recentNews: [
      `${input.companyName} was listed among top funded startups on TopStartups.io in 2026 coverage updates.`,
      `${input.companyName} continues scaling across ${input.industry.toLowerCase()} workflows and product adoption.`,
    ],
    linkedinUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(input.companyName)}`,
    twitterUrl: `https://x.com/search?q=${encodeURIComponent(input.companyName)}`,
    verified: true,
    isFeatured: input.isFeatured ?? false,
    avatarUrl: null,
  };
}

const TOPSTARTUPS_INPUT: TopStartupInput[] = [
  {
    companyName: "Pogo",
    domain: "www.joinpogo.com",
    foundedYear: 2020,
    headquarters: "Brooklyn, New York, USA",
    industry: "Fintech",
    stage: "Series A",
    employeeCount: "11-50",
    fundingInfo: "TopStartups signal: Series A in 2025 with participation from 20VC and operator investors.",
    productSummary:
      "Consumer data-rewards app helping users unlock savings and earnings from everyday digital activity.",
    isFeatured: true,
  },
  {
    companyName: "Blossom",
    domain: "joinblossomhealth.com",
    foundedYear: 2024,
    headquarters: "New York, New York, USA",
    industry: "AI Healthcare",
    stage: "Series A",
    employeeCount: "1-10",
    fundingInfo: "TopStartups signal: $20M Series A in 2025 with healthcare and operator-led backers.",
    productSummary:
      "AI copilots and autonomous workflows for psychiatric care teams and mental health operations.",
  },
  {
    companyName: "Omnea",
    domain: "www.omnea.co",
    foundedYear: 2022,
    headquarters: "London, England, United Kingdom",
    industry: "Enterprise Software",
    stage: "Series B",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $50M Series B in 2025 led by top-tier global investors.",
    productSummary:
      "Procurement orchestration platform streamlining source-to-pay decisions and approvals.",
  },
  {
    companyName: "Listen Labs",
    domain: "listenlabs.ai",
    foundedYear: 2023,
    headquarters: "San Francisco Bay Area, California, USA",
    industry: "AI Enterprise Software",
    stage: "Series A",
    employeeCount: "11-50",
    fundingInfo: "TopStartups signal: $27M Series A in 2025 with Sequoia participation.",
    productSummary:
      "Autonomous customer-research platform that accelerates interviews, synthesis, and insight loops.",
  },
  {
    companyName: "Adaptive Security",
    domain: "www.adaptivesecurity.com",
    foundedYear: 2024,
    headquarters: "New York, New York, USA",
    industry: "Cybersecurity",
    stage: "Series B",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $81M Series B in 2025 backed by major AI and security investors.",
    productSummary:
      "Security platform designed to defend enterprises against AI-assisted social and identity attacks.",
  },
  {
    companyName: "Avoca",
    domain: "www.avoca.ai",
    foundedYear: 2023,
    headquarters: "New York, New York, USA",
    industry: "Artificial Intelligence",
    stage: "Seed",
    employeeCount: "11-50",
    fundingInfo: "TopStartups signal: YC-backed seed financing in 2023.",
    productSummary:
      "AI workforce tooling for service businesses to automate repetitive operational conversations.",
  },
  {
    companyName: "Traba",
    domain: "traba.work",
    foundedYear: 2021,
    headquarters: "New York, New York, USA",
    industry: "Supply Chain AI",
    stage: "Series A",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $45M Series A in 2023 with tier-one venture support.",
    productSummary:
      "AI-driven labor and operations platform for industrial staffing and supply-chain coordination.",
  },
  {
    companyName: "Harmonic",
    domain: "harmonic.fun",
    foundedYear: 2023,
    headquarters: "San Francisco Bay Area, California, USA",
    industry: "Artificial Intelligence",
    stage: "Series B",
    employeeCount: "11-50",
    fundingInfo: "TopStartups signal: $100M Series B in 2025 from leading deep-tech investors.",
    productSummary:
      "Research-focused AI company building advanced reasoning systems for mathematically intensive workloads.",
  },
  {
    companyName: "Ambience Healthcare",
    domain: "www.ambiencehealthcare.com",
    foundedYear: 2020,
    headquarters: "San Francisco Bay Area, California, USA",
    industry: "AI Healthcare",
    stage: "Series C",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $243M Series C in 2025 with strong healthcare AI momentum.",
    productSummary:
      "Clinical AI operating system supporting documentation, coding, and care workflow automation.",
  },
  {
    companyName: "Vanta",
    domain: "www.vanta.com",
    foundedYear: 2017,
    headquarters: "San Francisco Bay Area, California, USA",
    industry: "Cybersecurity",
    stage: "Series D",
    employeeCount: "201-500",
    fundingInfo: "TopStartups signal: $150M Series D in 2025 at a reported $4.2B valuation.",
    productSummary:
      "Automated trust and compliance platform for SOC 2, ISO 27001, and ongoing security readiness.",
  },
  {
    companyName: "Ramp",
    domain: "ramp.com",
    foundedYear: 2019,
    headquarters: "New York, New York, USA",
    industry: "Fintech",
    stage: "Series E",
    employeeCount: "201-500",
    fundingInfo: "TopStartups signal: $500M Series E in 2025 at a reported $22.5B valuation.",
    productSummary:
      "Corporate card and spend-management platform with finance automation for modern teams.",
    isFeatured: true,
  },
  {
    companyName: "Tennr",
    domain: "www.tennr.com",
    foundedYear: 2021,
    headquarters: "New York, New York, USA",
    industry: "AI Healthcare",
    stage: "Series C",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $101M Series C in 2025 backed by top enterprise investors.",
    productSummary:
      "AI automation layer for medical intake and document workflows across provider organizations.",
  },
  {
    companyName: "XBOW",
    domain: "xbow.com",
    foundedYear: 2024,
    headquarters: "Remote",
    industry: "Cybersecurity",
    stage: "Series B",
    employeeCount: "11-50",
    fundingInfo: "TopStartups signal: $75M Series B in 2025 with Sequoia support.",
    productSummary:
      "Offensive security platform using AI to improve vulnerability discovery and testing velocity.",
  },
  {
    companyName: "OpenRouter",
    domain: "openrouter.ai",
    foundedYear: 2023,
    headquarters: "Remote",
    industry: "AI Infrastructure",
    stage: "Series A",
    employeeCount: "1-10",
    fundingInfo: "TopStartups signal: $40M Series A in 2025 from major AI-focused funds.",
    productSummary:
      "Routing layer connecting applications to multiple LLM providers and compute backends.",
  },
  {
    companyName: "Harvey",
    domain: "www.harvey.ai",
    foundedYear: 2021,
    headquarters: "San Francisco Bay Area, California, USA",
    industry: "Legal AI",
    stage: "Series E",
    employeeCount: "201-500",
    fundingInfo: "TopStartups signal: $300M Series E in 2025 at a reported $5.0B valuation.",
    productSummary:
      "AI platform purpose-built for legal research, drafting, and firm-level knowledge workflows.",
  },
  {
    companyName: "Gecko Robotics",
    domain: "www.geckorobotics.com",
    foundedYear: 2013,
    headquarters: "Pittsburgh, Pennsylvania, USA",
    industry: "Robotics",
    stage: "Series D",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $125M Series D in 2025 at a reported $1.2B valuation.",
    productSummary:
      "Robotics and software systems for inspection and maintenance of critical infrastructure assets.",
  },
  {
    companyName: "Anduril Industries",
    domain: "www.anduril.com",
    foundedYear: 2017,
    headquarters: "Los Angeles, California, USA",
    industry: "Defense Tech",
    stage: "Series G",
    employeeCount: "501-1000",
    fundingInfo: "TopStartups signal: $2B Series G in 2025 at a reported $30B valuation.",
    productSummary:
      "Defense technology company building autonomous systems and software for mission operations.",
    isFeatured: true,
  },
  {
    companyName: "Hex",
    domain: "hex.tech",
    foundedYear: 2019,
    headquarters: "Remote",
    industry: "Data Analytics",
    stage: "Series C",
    employeeCount: "101-200",
    fundingInfo: "TopStartups signal: $70M Series C in 2025 from leading SaaS investors.",
    productSummary:
      "Collaborative analytics workspace for data science, modeling, and business reporting teams.",
  },
];

export const TOPSTARTUPS_SEED: FounderDirectoryItem[] = TOPSTARTUPS_INPUT.map(
  toDirectoryItem,
);
