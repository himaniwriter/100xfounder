import type { FounderDirectoryItem } from "@/lib/founders/types";

export const GROWTHLIST_US_SOURCE_URL = "https://growthlist.co/united-states-startups/";

type GrowthListStartupInput = {
  companyName: string;
  headquarters: string;
  industry: string;
  stage: string;
  fundingAmount: string;
  fundingDate: string;
  sourceUrl: string;
  summary: string;
  websiteUrl?: string | null;
  founderName?: string;
  foundedYear?: number | null;
  employeeCount?: string | null;
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

  if (key.includes("ai") || key.includes("machine learning")) {
    return ["Python", "TypeScript", "Kubernetes", "AWS"];
  }

  if (key.includes("health") || key.includes("biotech") || key.includes("med")) {
    return ["Python", "React", "PostgreSQL", "GCP"];
  }

  if (key.includes("fintech") || key.includes("payments") || key.includes("bank")) {
    return ["Java", "PostgreSQL", "Kafka", "AWS"];
  }

  if (key.includes("security")) {
    return ["Go", "Python", "Kubernetes", "GCP"];
  }

  if (key.includes("energy") || key.includes("climate")) {
    return ["Python", "AWS", "Snowflake", "React"];
  }

  if (key.includes("commerce") || key.includes("consumer")) {
    return ["Node.js", "React", "PostgreSQL", "AWS"];
  }

  return ["React", "Node.js", "PostgreSQL", "AWS"];
}

function inferEmployeeCount(stage: string): string {
  if (/pre[- ]seed|seed/i.test(stage)) return "11-50";
  if (/series\s*a|series\s*b/i.test(stage)) return "51-200";
  if (/series\s*c|series\s*d/i.test(stage)) return "201-500";
  if (/series\s*e|series\s*f|series\s*g|private equity|debt financing/i.test(stage)) {
    return "501-1000";
  }
  return "51-200";
}

function parseFundingMillions(value: string): number {
  const numeric = value.replace(/[^0-9.]/g, "");
  const amount = Number.parseFloat(numeric);
  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (/b/i.test(value)) {
    return amount * 1000;
  }

  return amount;
}

function isFeaturedRound(input: GrowthListStartupInput): boolean {
  if (typeof input.isFeatured === "boolean") {
    return input.isFeatured;
  }

  const amountInMillions = parseFundingMillions(input.fundingAmount);
  if (amountInMillions >= 100) {
    return true;
  }

  return /series\s*[d-z]|private equity|debt financing/i.test(input.stage);
}

function toDirectoryItem(
  input: GrowthListStartupInput,
  index: number,
): FounderDirectoryItem {
  const companySlug = slugify(input.companyName);
  const founderName = input.founderName ?? `${input.companyName} Leadership Team`;
  const founderSlug = slugify(founderName);
  const fundingInfo = `GrowthList signal: ${input.fundingAmount} ${input.stage} (${input.fundingDate}) in ${input.headquarters}.`;

  return {
    id: `growthlist-us-${index + 1}-${companySlug}`,
    slug: `${founderSlug}-${companySlug}`,
    companySlug,
    founderName,
    companyName: input.companyName,
    foundedYear: input.foundedYear ?? null,
    headquarters: input.headquarters,
    industry: input.industry,
    stage: input.stage,
    productSummary: input.summary,
    fundingInfo,
    sourceUrl: input.sourceUrl,
    ycProfileUrl: `https://www.ycombinator.com/founders?query=${encodeURIComponent(input.companyName)}`,
    websiteUrl: input.websiteUrl ?? null,
    employeeCount: input.employeeCount ?? inferEmployeeCount(input.stage),
    techStack: inferTechStack(input.industry),
    recentNews: [
      `${input.companyName} closed a ${input.fundingAmount} ${input.stage} round in ${input.fundingDate}.`,
      `${input.companyName} is expanding in ${input.industry.toLowerCase()} from ${input.headquarters}.`,
    ],
    linkedinUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(input.companyName)}`,
    twitterUrl: `https://x.com/search?q=${encodeURIComponent(input.companyName)}`,
    verified: true,
    isFeatured: isFeaturedRound(input),
    avatarUrl: null,
  };
}

const US_SOURCE = "https://growthlist.co/united-states-startups/";
const SF_SOURCE = "https://growthlist.co/san-francisco-startups/";
const LA_SOURCE = "https://growthlist.co/los-angeles-startups/";
const CHI_SOURCE = "https://growthlist.co/chicago-startups/";
const SEA_SOURCE = "https://growthlist.co/seattle-startups/";
const BOS_SOURCE = "https://growthlist.co/boston-startups/";
const MIA_SOURCE = "https://growthlist.co/miami-startups/";
const DC_SOURCE = "https://growthlist.co/washington-dc-startups/";
const DAL_SOURCE = "https://growthlist.co/dallas-startups/";
const PHL_SOURCE = "https://growthlist.co/philadelphia-startups/";
const SD_SOURCE = "https://growthlist.co/san-diego-startups/";
const HOU_SOURCE = "https://growthlist.co/houston-startups/";
const ATL_SOURCE = "https://growthlist.co/atlanta-startups/";
const DEN_SOURCE = "https://growthlist.co/denver-startups/";

const GROWTHLIST_US_INPUT: GrowthListStartupInput[] = [
  {
    companyName: "Lightyear",
    headquarters: "New York, New York, USA",
    industry: "Fintech",
    stage: "Series B",
    fundingAmount: "$23M",
    fundingDate: "2026-02-20",
    sourceUrl: US_SOURCE,
    summary:
      "Software platform that helps teams compare and procure telecom and internet infrastructure with transparent pricing.",
    websiteUrl: "https://lightyear.ai",
  },
  {
    companyName: "Concourse",
    headquarters: "New York, New York, USA",
    industry: "GovTech",
    stage: "Seed",
    fundingAmount: "$6.7M",
    fundingDate: "2026-02-26",
    sourceUrl: US_SOURCE,
    summary:
      "Procurement and grants workflow product helping public-sector teams manage documents, approvals, and vendor coordination.",
  },
  {
    companyName: "Opendate",
    headquarters: "Los Angeles, California, USA",
    industry: "Commerce Infrastructure",
    stage: "Series A",
    fundingAmount: "$9.2M",
    fundingDate: "2026-02-24",
    sourceUrl: US_SOURCE,
    summary:
      "Venue operations platform for ticketing, booking, and customer lifecycle workflows across entertainment businesses.",
  },
  {
    companyName: "Apex Clean Energy",
    headquarters: "Charlottesville, Virginia, USA",
    industry: "Climate Infrastructure",
    stage: "Debt Financing",
    fundingAmount: "$825M",
    fundingDate: "2026-02-14",
    sourceUrl: US_SOURCE,
    summary:
      "Developer and operator of utility-scale renewable power assets focused on grid-ready clean energy projects.",
    websiteUrl: "https://www.apexcleanenergy.com",
  },
  {
    companyName: "Mesh",
    headquarters: "San Francisco, California, USA",
    industry: "Fintech Infrastructure",
    stage: "Series B",
    fundingAmount: "$82M",
    fundingDate: "2026-01-31",
    sourceUrl: US_SOURCE,
    summary:
      "Digital asset and embedded finance infrastructure connecting custodial, exchange, and treasury systems.",
    websiteUrl: "https://www.meshconnect.com",
  },
  {
    companyName: "IrisGo.AI",
    headquarters: "Austin, Texas, USA",
    industry: "AI Security",
    stage: "Seed",
    fundingAmount: "$4M",
    fundingDate: "2025-11-17",
    sourceUrl: US_SOURCE,
    summary:
      "AI-native security operations platform for automated detection, incident handling, and policy orchestration.",
  },
  {
    companyName: "Datalinx AI",
    headquarters: "Austin, Texas, USA",
    industry: "AI Data Infrastructure",
    stage: "Seed",
    fundingAmount: "$5M",
    fundingDate: "2025-11-14",
    sourceUrl: US_SOURCE,
    summary:
      "Data quality and metadata intelligence layer for machine learning teams and high-volume analytics operations.",
  },
  {
    companyName: "Fanchize",
    headquarters: "Los Angeles, California, USA",
    industry: "Creator Economy",
    stage: "Seed",
    fundingAmount: "$1.5M",
    fundingDate: "2025-11-14",
    sourceUrl: US_SOURCE,
    summary:
      "Platform that helps creators and community brands launch and scale monetizable digital memberships.",
  },
  {
    companyName: "Ceremonia",
    headquarters: "New York, New York, USA",
    industry: "Consumer Brand",
    stage: "Series A",
    fundingAmount: "$10M",
    fundingDate: "2025-10-17",
    sourceUrl: US_SOURCE,
    summary:
      "Modern beauty brand using digitally native commerce and retention systems to scale multicultural product lines.",
  },
  {
    companyName: "Midship",
    headquarters: "San Francisco, California, USA",
    industry: "Defense Tech",
    stage: "Seed",
    fundingAmount: "$2M",
    fundingDate: "2025-10-15",
    sourceUrl: US_SOURCE,
    summary:
      "Defense technology startup building software and autonomy tools for mission planning and field operations.",
  },
  {
    companyName: "Altido Therapeutics",
    headquarters: "Boston, Massachusetts, USA",
    industry: "Biotech",
    stage: "Seed",
    fundingAmount: "$2.3M",
    fundingDate: "2025-10-13",
    sourceUrl: US_SOURCE,
    summary:
      "Therapeutics startup focused on next-generation treatment programs using precision biology workflows.",
  },
  {
    companyName: "Ferra",
    headquarters: "San Francisco, California, USA",
    industry: "AI Infrastructure",
    stage: "Pre-Seed",
    fundingAmount: "$2.4M",
    fundingDate: "2025-10-13",
    sourceUrl: US_SOURCE,
    summary:
      "Model tooling startup building infrastructure to evaluate and deploy LLM-powered products with reliability controls.",
  },
  {
    companyName: "Fortitude Biomedicines",
    headquarters: "Boston, Massachusetts, USA",
    industry: "Biotech",
    stage: "Series A",
    fundingAmount: "$100M",
    fundingDate: "2025-10-02",
    sourceUrl: US_SOURCE,
    summary:
      "Biomedicine company advancing clinical programs with translational science and data-guided therapeutic design.",
  },
  {
    companyName: "Kore.ai",
    headquarters: "Orlando, Florida, USA",
    industry: "Enterprise AI",
    stage: "Private Equity",
    fundingAmount: "$150M",
    fundingDate: "2025-09-22",
    sourceUrl: US_SOURCE,
    summary:
      "Enterprise conversational AI platform for virtual assistants, workflow automation, and contact-center operations.",
    websiteUrl: "https://kore.ai",
  },
  {
    companyName: "Decagon",
    headquarters: "San Francisco, California, USA",
    industry: "AI Customer Operations",
    stage: "Series C",
    fundingAmount: "$131M",
    fundingDate: "2026-02-26",
    sourceUrl: SF_SOURCE,
    summary:
      "AI agents platform helping support teams automate customer conversations, escalations, and quality assurance.",
    websiteUrl: "https://decagon.ai",
  },
  {
    companyName: "Upwind Security",
    headquarters: "San Francisco, California, USA",
    industry: "Cloud Security",
    stage: "Series C",
    fundingAmount: "$100M",
    fundingDate: "2026-02-26",
    sourceUrl: SF_SOURCE,
    summary:
      "Runtime cloud security product delivering threat detection and remediation across modern containerized stacks.",
    websiteUrl: "https://www.upwind.io",
  },
  {
    companyName: "Zocks",
    headquarters: "San Francisco, California, USA",
    industry: "Fintech AI",
    stage: "Series A",
    fundingAmount: "$13.8M",
    fundingDate: "2026-02-20",
    sourceUrl: SF_SOURCE,
    summary:
      "AI-powered platform helping wealth and advisory teams streamline client workflows, notes, and compliance records.",
  },
  {
    companyName: "Foundry Robotics",
    headquarters: "San Francisco, California, USA",
    industry: "Robotics",
    stage: "Series B",
    fundingAmount: "$80M",
    fundingDate: "2026-02-11",
    sourceUrl: SF_SOURCE,
    summary:
      "Industrial robotics company developing autonomous systems for precision manufacturing and process automation.",
  },
  {
    companyName: "Span",
    headquarters: "San Francisco, California, USA",
    industry: "Energy Tech",
    stage: "Series C",
    fundingAmount: "$96M",
    fundingDate: "2026-02-10",
    sourceUrl: SF_SOURCE,
    summary:
      "Home energy technology company building smart panel hardware and software for electrification workflows.",
    websiteUrl: "https://www.span.io",
  },
  {
    companyName: "Goodfire",
    headquarters: "San Francisco, California, USA",
    industry: "AI Infrastructure",
    stage: "Series B",
    fundingAmount: "$50M",
    fundingDate: "2026-02-10",
    sourceUrl: SF_SOURCE,
    summary:
      "Infrastructure layer for ML teams to run model experimentation, evaluation, and deployment at production scale.",
  },
  {
    companyName: "Bedrock Robotics",
    headquarters: "San Francisco, California, USA",
    industry: "Construction Robotics",
    stage: "Series A",
    fundingAmount: "$80M",
    fundingDate: "2026-02-07",
    sourceUrl: SF_SOURCE,
    summary:
      "Robotics startup building autonomy systems for heavy-equipment and construction site productivity.",
  },
  {
    companyName: "OpenEvidence",
    headquarters: "San Francisco, California, USA",
    industry: "Healthcare AI",
    stage: "Series B",
    fundingAmount: "$210M",
    fundingDate: "2026-02-04",
    sourceUrl: SF_SOURCE,
    summary:
      "Clinical AI assistant for physicians that synthesizes medical evidence and supports point-of-care decisions.",
    websiteUrl: "https://www.openevidence.com",
  },
  {
    companyName: "Breezy",
    headquarters: "Los Angeles, California, USA",
    industry: "Consumer Fintech",
    stage: "Pre-Seed",
    fundingAmount: "$1.5M",
    fundingDate: "2025-12-09",
    sourceUrl: LA_SOURCE,
    summary:
      "Consumer fintech app focused on smoother budgeting, savings automation, and daily money movement.",
  },
  {
    companyName: "Midi Health",
    headquarters: "Los Angeles, California, USA",
    industry: "HealthTech",
    stage: "Series B",
    fundingAmount: "$100M",
    fundingDate: "2025-11-14",
    sourceUrl: LA_SOURCE,
    summary:
      "Digital care platform for women’s midlife health with clinician workflows, diagnostics, and patient engagement.",
    websiteUrl: "https://www.joinmidi.com",
  },
  {
    companyName: "Mitra EV",
    headquarters: "Los Angeles, California, USA",
    industry: "Mobility Tech",
    stage: "Venture Round",
    fundingAmount: "$15M",
    fundingDate: "2025-10-24",
    sourceUrl: LA_SOURCE,
    summary:
      "Electric fleet and mobility software platform improving operational planning, charging, and utilization efficiency.",
  },
  {
    companyName: "Hardline",
    headquarters: "Los Angeles, California, USA",
    industry: "Defense Tech",
    stage: "Series A",
    fundingAmount: "$14M",
    fundingDate: "2025-10-10",
    sourceUrl: LA_SOURCE,
    summary:
      "Mission software startup building resilient communication and tactical decision-support systems.",
  },
  {
    companyName: "Haven Energy",
    headquarters: "Los Angeles, California, USA",
    industry: "Energy Tech",
    stage: "Seed",
    fundingAmount: "$4.2M",
    fundingDate: "2025-07-31",
    sourceUrl: LA_SOURCE,
    summary:
      "Distributed energy platform helping residential and commercial users optimize power reliability and costs.",
  },
  {
    companyName: "BestFarewell",
    headquarters: "Chicago, Illinois, USA",
    industry: "InsurTech",
    stage: "Pre-Seed",
    fundingAmount: "$2.5M",
    fundingDate: "2026-01-30",
    sourceUrl: CHI_SOURCE,
    summary:
      "Insurance workflow startup modernizing end-of-life planning and claim-related service experiences.",
  },
  {
    companyName: "Prenosis",
    headquarters: "Chicago, Illinois, USA",
    industry: "Healthcare AI",
    stage: "Growth Round",
    fundingAmount: "$100M",
    fundingDate: "2026-01-08",
    sourceUrl: CHI_SOURCE,
    summary:
      "Clinical decision intelligence company using machine learning to improve risk prediction and care pathways.",
    websiteUrl: "https://www.prenosis.com",
  },
  {
    companyName: "Evergreen",
    headquarters: "Chicago, Illinois, USA",
    industry: "Fintech",
    stage: "Growth Round",
    fundingAmount: "$50M",
    fundingDate: "2026-01-08",
    sourceUrl: CHI_SOURCE,
    summary:
      "Financial operations platform focused on treasury optimization and capital planning for modern businesses.",
  },
  {
    companyName: "Renterra",
    headquarters: "Chicago, Illinois, USA",
    industry: "Construction SaaS",
    stage: "Seed",
    fundingAmount: "$3M",
    fundingDate: "2025-11-25",
    sourceUrl: CHI_SOURCE,
    summary:
      "B2B software platform helping equipment rental businesses manage quoting, contracts, and field operations.",
  },
  {
    companyName: "Arkero",
    headquarters: "Seattle, Washington, USA",
    industry: "Enterprise AI",
    stage: "Series A",
    fundingAmount: "$26.7M",
    fundingDate: "2026-01-30",
    sourceUrl: SEA_SOURCE,
    summary:
      "Enterprise AI platform enabling internal copilots, workflow automations, and secure data integrations.",
  },
  {
    companyName: "Overland AI",
    headquarters: "Seattle, Washington, USA",
    industry: "Autonomy",
    stage: "Series A",
    fundingAmount: "$32M",
    fundingDate: "2026-01-14",
    sourceUrl: SEA_SOURCE,
    summary:
      "Autonomy software company building off-road navigation and mission systems for defense and industrial use cases.",
    websiteUrl: "https://www.overland.ai",
  },
  {
    companyName: "Avalanche Energy",
    headquarters: "Seattle, Washington, USA",
    industry: "Climate Tech",
    stage: "Series B",
    fundingAmount: "$40M",
    fundingDate: "2026-01-08",
    sourceUrl: SEA_SOURCE,
    summary:
      "Energy startup developing compact fusion systems and hardware for long-term clean power applications.",
  },
  {
    companyName: "Gradial",
    headquarters: "Seattle, Washington, USA",
    industry: "AI Marketing Tech",
    stage: "Series A",
    fundingAmount: "$13M",
    fundingDate: "2025-11-26",
    sourceUrl: SEA_SOURCE,
    summary:
      "Marketing operations copilot for campaign planning, content workflows, and pipeline attribution.",
  },
  {
    companyName: "Carbon Robotics",
    headquarters: "Seattle, Washington, USA",
    industry: "Agri Robotics",
    stage: "Series D",
    fundingAmount: "$70M",
    fundingDate: "2025-11-11",
    sourceUrl: SEA_SOURCE,
    summary:
      "Agricultural robotics company automating weed control and farm precision workflows at scale.",
    websiteUrl: "https://carbonrobotics.com",
  },
  {
    companyName: "Supio",
    headquarters: "Seattle, Washington, USA",
    industry: "Legal AI",
    stage: "Series B",
    fundingAmount: "$60M",
    fundingDate: "2025-10-29",
    sourceUrl: SEA_SOURCE,
    summary:
      "AI platform for legal teams to organize case data, draft materials, and accelerate litigation preparation.",
    websiteUrl: "https://www.supio.com",
  },
  {
    companyName: "7AI",
    headquarters: "Boston, Massachusetts, USA",
    industry: "Cybersecurity AI",
    stage: "Seed",
    fundingAmount: "$36M",
    fundingDate: "2025-11-06",
    sourceUrl: BOS_SOURCE,
    summary:
      "Autonomous security operations platform combining AI triage, playbooks, and analyst workflows.",
  },
  {
    companyName: "Psivant Therapeutics",
    headquarters: "Boston, Massachusetts, USA",
    industry: "Biotech",
    stage: "Series A",
    fundingAmount: "$19.2M",
    fundingDate: "2025-10-16",
    sourceUrl: BOS_SOURCE,
    summary:
      "Biotech startup advancing targeted therapeutic programs and translational development platforms.",
  },
  {
    companyName: "Allonnia",
    headquarters: "Boston, Massachusetts, USA",
    industry: "Climate Biotech",
    stage: "Series B",
    fundingAmount: "$40M",
    fundingDate: "2025-09-03",
    sourceUrl: BOS_SOURCE,
    summary:
      "Biotechnology company building biological solutions for industrial decarbonization and remediation workflows.",
    websiteUrl: "https://www.allonnia.com",
  },
  {
    companyName: "Code Metal",
    headquarters: "Boston, Massachusetts, USA",
    industry: "AI Developer Tools",
    stage: "Series A",
    fundingAmount: "$16.5M",
    fundingDate: "2025-08-28",
    sourceUrl: BOS_SOURCE,
    summary:
      "Developer tooling startup using AI to improve software delivery speed, reliability, and code quality standards.",
  },
  {
    companyName: "Alfred",
    headquarters: "Miami, Florida, USA",
    industry: "Hospitality Tech",
    stage: "Seed",
    fundingAmount: "$4.2M",
    fundingDate: "2026-02-14",
    sourceUrl: MIA_SOURCE,
    summary:
      "Hospitality operations product for guest communication, service requests, and property workflow automation.",
  },
  {
    companyName: "Biller Genie",
    headquarters: "Miami, Florida, USA",
    industry: "Fintech SaaS",
    stage: "Series A",
    fundingAmount: "$11M",
    fundingDate: "2026-01-17",
    sourceUrl: MIA_SOURCE,
    summary:
      "Accounts receivable automation platform helping finance teams reduce manual invoicing and speed collections.",
    websiteUrl: "https://billergenie.com",
  },
  {
    companyName: "Exowatt",
    headquarters: "Miami, Florida, USA",
    industry: "Energy Tech",
    stage: "Series A",
    fundingAmount: "$70M",
    fundingDate: "2025-11-13",
    sourceUrl: MIA_SOURCE,
    summary:
      "Energy infrastructure startup focused on modular systems for industrial-grade clean power deployment.",
  },
  {
    companyName: "Xenia",
    headquarters: "Miami, Florida, USA",
    industry: "Operations SaaS",
    stage: "Series A",
    fundingAmount: "$16M",
    fundingDate: "2025-10-15",
    sourceUrl: MIA_SOURCE,
    summary:
      "Frontline operations platform for inspections, maintenance workflows, and multi-site compliance execution.",
    websiteUrl: "https://www.xenia.team",
  },
  {
    companyName: "Hydrosat",
    headquarters: "Washington, DC, USA",
    industry: "Climate Intelligence",
    stage: "Series B",
    fundingAmount: "$20M",
    fundingDate: "2026-01-08",
    sourceUrl: DC_SOURCE,
    summary:
      "Satellite analytics platform turning earth-observation data into climate and water risk intelligence.",
    websiteUrl: "https://hydrosat.com",
  },
  {
    companyName: "Last Energy",
    headquarters: "Washington, DC, USA",
    industry: "Nuclear Energy",
    stage: "Series B",
    fundingAmount: "$40M",
    fundingDate: "2025-11-13",
    sourceUrl: DC_SOURCE,
    summary:
      "Energy company developing small modular nuclear power projects for industrial and grid-scale demand.",
    websiteUrl: "https://www.lastenergy.com",
  },
  {
    companyName: "Chamber Cardio",
    headquarters: "Washington, DC, USA",
    industry: "MedTech",
    stage: "Seed",
    fundingAmount: "$3.8M",
    fundingDate: "2025-11-13",
    sourceUrl: DC_SOURCE,
    summary:
      "Cardiovascular diagnostics startup building technology to improve triage and care coordination for heart patients.",
  },
  {
    companyName: "Quindar",
    headquarters: "Washington, DC, USA",
    industry: "Space Infrastructure",
    stage: "Seed",
    fundingAmount: "$4M",
    fundingDate: "2025-08-06",
    sourceUrl: DC_SOURCE,
    summary:
      "Mission software layer for satellite operations, command automation, and fleet-level observability.",
    websiteUrl: "https://www.quindar.space",
  },
  {
    companyName: "Yendo",
    headquarters: "Dallas, Texas, USA",
    industry: "Fintech",
    stage: "Debt Financing",
    fundingAmount: "$150M",
    fundingDate: "2025-12-12",
    sourceUrl: DAL_SOURCE,
    summary:
      "Asset-backed consumer credit platform expanding access to flexible financing products.",
    websiteUrl: "https://www.yendo.com",
  },
  {
    companyName: "DataBahn.ai",
    headquarters: "Dallas, Texas, USA",
    industry: "AI Security",
    stage: "Series A",
    fundingAmount: "$17M",
    fundingDate: "2025-10-09",
    sourceUrl: DAL_SOURCE,
    summary:
      "Security intelligence startup using AI to connect fragmented telemetry and accelerate incident response.",
    websiteUrl: "https://www.databahn.ai",
  },
  {
    companyName: "FieldPulse",
    headquarters: "Dallas, Texas, USA",
    industry: "Field Service SaaS",
    stage: "Series B",
    fundingAmount: "$11.7M",
    fundingDate: "2025-09-17",
    sourceUrl: DAL_SOURCE,
    summary:
      "Service business platform for scheduling, invoicing, dispatch, and technician productivity operations.",
    websiteUrl: "https://www.fieldpulse.com",
  },
  {
    companyName: "Texas Stock Exchange",
    headquarters: "Dallas, Texas, USA",
    industry: "Capital Markets",
    stage: "Growth Round",
    fundingAmount: "$161M",
    fundingDate: "2025-08-09",
    sourceUrl: DAL_SOURCE,
    summary:
      "Exchange infrastructure initiative focused on modern market access and listing innovation.",
    websiteUrl: "https://txse.com",
  },
  {
    companyName: "Gopuff",
    headquarters: "Philadelphia, Pennsylvania, USA",
    industry: "Quick Commerce",
    stage: "Debt Financing",
    fundingAmount: "$1.5B",
    fundingDate: "2025-11-07",
    sourceUrl: PHL_SOURCE,
    summary:
      "Instant delivery platform combining logistics software and micro-fulfillment operations for local commerce.",
    websiteUrl: "https://www.gopuff.com",
  },
  {
    companyName: "Proscia",
    headquarters: "Philadelphia, Pennsylvania, USA",
    industry: "Digital Pathology",
    stage: "Series C",
    fundingAmount: "$50M",
    fundingDate: "2025-09-17",
    sourceUrl: PHL_SOURCE,
    summary:
      "Pathology intelligence platform using AI to improve diagnosis workflows and lab productivity.",
    websiteUrl: "https://www.proscia.com",
  },
  {
    companyName: "Asylon",
    headquarters: "Philadelphia, Pennsylvania, USA",
    industry: "Robotics Security",
    stage: "Series B",
    fundingAmount: "$27M",
    fundingDate: "2025-07-29",
    sourceUrl: PHL_SOURCE,
    summary:
      "Drone and robotic security operations company focused on autonomous perimeter monitoring.",
    websiteUrl: "https://asylonrobotics.com",
  },
  {
    companyName: "Arya Health",
    headquarters: "Philadelphia, Pennsylvania, USA",
    industry: "HealthTech",
    stage: "Seed",
    fundingAmount: "$2M",
    fundingDate: "2025-02-13",
    sourceUrl: PHL_SOURCE,
    summary:
      "Healthcare workflow platform improving patient communication, scheduling, and operational efficiency.",
  },
  {
    companyName: "Mirador Therapeutics",
    headquarters: "San Diego, California, USA",
    industry: "Biotech",
    stage: "Post-IPO Debt",
    fundingAmount: "$400M",
    fundingDate: "2025-10-17",
    sourceUrl: SD_SOURCE,
    summary:
      "Therapeutics company advancing immune-focused clinical assets and precision development programs.",
  },
  {
    companyName: "Rakuten Medical",
    headquarters: "San Diego, California, USA",
    industry: "Biotech",
    stage: "Series D",
    fundingAmount: "$166M",
    fundingDate: "2025-09-30",
    sourceUrl: SD_SOURCE,
    summary:
      "Clinical-stage biotechnology company building photoimmunotherapy platforms for oncology treatment.",
    websiteUrl: "https://rakuten-med.com",
  },
  {
    companyName: "Iambic Therapeutics",
    headquarters: "San Diego, California, USA",
    industry: "AI Drug Discovery",
    stage: "Debt Financing",
    fundingAmount: "$50M",
    fundingDate: "2025-07-16",
    sourceUrl: SD_SOURCE,
    summary:
      "AI-enabled drug discovery company combining computational chemistry and translational biology workflows.",
    websiteUrl: "https://www.iambic.ai",
  },
  {
    companyName: "Cart.com",
    headquarters: "Houston, Texas, USA",
    industry: "Commerce Infrastructure",
    stage: "Debt Financing",
    fundingAmount: "$50M",
    fundingDate: "2026-01-16",
    sourceUrl: HOU_SOURCE,
    summary:
      "Unified commerce platform offering order management, fulfillment, and merchant operations software.",
    websiteUrl: "https://cart.com",
  },
  {
    companyName: "Persona AI",
    headquarters: "Houston, Texas, USA",
    industry: "AI Enterprise Software",
    stage: "Seed",
    fundingAmount: "$27M",
    fundingDate: "2025-11-11",
    sourceUrl: HOU_SOURCE,
    summary:
      "Enterprise AI platform focused on role-based assistants and internal workflow automation.",
  },
  {
    companyName: "Spark Biomedical",
    headquarters: "Houston, Texas, USA",
    industry: "MedTech",
    stage: "Series C",
    fundingAmount: "$15M",
    fundingDate: "2025-10-17",
    sourceUrl: HOU_SOURCE,
    summary:
      "Bioelectronic medicine company developing neuromodulation devices for therapeutic and recovery applications.",
    websiteUrl: "https://sparkbiomedical.com",
  },
  {
    companyName: "Flock Safety",
    headquarters: "Atlanta, Georgia, USA",
    industry: "Security Technology",
    stage: "Series F",
    fundingAmount: "$275M",
    fundingDate: "2026-02-04",
    sourceUrl: ATL_SOURCE,
    summary:
      "Public safety technology platform combining smart hardware and analytics for community security operations.",
    websiteUrl: "https://www.flocksafety.com",
  },
  {
    companyName: "Sema4.ai",
    headquarters: "Atlanta, Georgia, USA",
    industry: "Enterprise AI",
    stage: "Series A",
    fundingAmount: "$25M",
    fundingDate: "2025-09-17",
    sourceUrl: ATL_SOURCE,
    summary:
      "Enterprise automation startup delivering AI agents for process execution and operational decision support.",
    websiteUrl: "https://sema4.ai",
  },
  {
    companyName: "PlayerZero",
    headquarters: "Atlanta, Georgia, USA",
    industry: "AI Developer Tools",
    stage: "Series A",
    fundingAmount: "$15M",
    fundingDate: "2025-09-11",
    sourceUrl: ATL_SOURCE,
    summary:
      "Software reliability platform using AI to triage incidents and improve engineering response quality.",
    websiteUrl: "https://playerzero.ai",
  },
  {
    companyName: "Struction",
    headquarters: "Denver, Colorado, USA",
    industry: "Construction SaaS",
    stage: "Seed",
    fundingAmount: "$2.2M",
    fundingDate: "2025-12-31",
    sourceUrl: DEN_SOURCE,
    summary:
      "Construction operations software startup focused on project visibility, workflows, and documentation.",
  },
  {
    companyName: "VieCure",
    headquarters: "Denver, Colorado, USA",
    industry: "Oncology Tech",
    stage: "Private Equity",
    fundingAmount: "$52M",
    fundingDate: "2025-08-27",
    sourceUrl: DEN_SOURCE,
    summary:
      "Cancer care intelligence platform supporting treatment planning and evidence-based clinical workflows.",
    websiteUrl: "https://viecure.com",
  },
];

export const GROWTHLIST_US_SEED: FounderDirectoryItem[] = GROWTHLIST_US_INPUT.map(
  toDirectoryItem,
);
