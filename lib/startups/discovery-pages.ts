export type StartupDiscoveryFocus =
  | "industry"
  | "stage"
  | "size"
  | "founded"
  | "location";

export type StartupDiscoveryPage = {
  slug: string;
  label: string;
  title: string;
  description: string;
  focus: StartupDiscoveryFocus;
  industryKeywords?: string[];
  stageGroup?: "early" | "growth" | "mature";
  maxEmployees?: number;
  foundedYear?: number;
  locationKeywords?: string[];
};

const INDIA_LOCATION_KEYWORDS = [
  "india",
  "bangalore",
  "bengaluru",
  "mumbai",
  "delhi",
  "new delhi",
  "gurgaon",
  "gurugram",
  "noida",
  "hyderabad",
  "pune",
  "chennai",
  "jaipur",
  "kolkata",
  "ahmedabad",
];

const US_LOCATION_KEYWORDS = [
  "usa",
  "united states",
  "new york",
  "san francisco",
  "los angeles",
  "chicago",
  "austin",
  "boston",
  "seattle",
  "miami",
  "washington",
  "dc",
  "dallas",
  "philadelphia",
  "san diego",
  "houston",
  "atlanta",
  "denver",
];

export const STARTUP_DISCOVERY_PAGES: StartupDiscoveryPage[] = [
  {
    slug: "ai-startups",
    label: "AI startups",
    title: "AI Startups",
    description:
      "Explore AI startups across India and the US, including infrastructure, copilots, and vertical AI workflows.",
    focus: "industry",
    industryKeywords: ["ai", "artificial intelligence", "llm", "machine learning", "genai"],
  },
  {
    slug: "biotech-startups",
    label: "Biotech startups",
    title: "Biotech Startups",
    description:
      "Find biotech startups building life science products, clinical platforms, and health innovation systems.",
    focus: "industry",
    industryKeywords: ["biotech", "bio", "life science", "genomics"],
  },
  {
    slug: "cybersecurity-startups",
    label: "Cybersecurity startups",
    title: "Cybersecurity Startups",
    description:
      "Track cybersecurity startups focused on enterprise defense, identity, trust, and AI-native security tooling.",
    focus: "industry",
    industryKeywords: ["cybersecurity", "security", "infosec", "trust"],
  },
  {
    slug: "e-commerce-startups",
    label: "E-Commerce startups",
    title: "E-Commerce Startups",
    description:
      "Browse e-commerce startups and commerce infrastructure companies with high-growth distribution models.",
    focus: "industry",
    industryKeywords: ["ecommerce", "e-commerce", "commerce", "retail"],
  },
  {
    slug: "edtech-startups",
    label: "EdTech startups",
    title: "EdTech Startups",
    description:
      "Discover edtech startups building learning, skilling, and career acceleration products for global users.",
    focus: "industry",
    industryKeywords: ["edtech", "education", "learning", "upskilling"],
  },
  {
    slug: "fintech-startups",
    label: "FinTech startups",
    title: "FinTech Startups",
    description:
      "Find fintech startups across payments, banking infrastructure, spend management, and lending systems.",
    focus: "industry",
    industryKeywords: ["fintech", "payments", "banking", "lending", "credit", "finance"],
  },
  {
    slug: "healthcare-startups",
    label: "Healthcare startups",
    title: "Healthcare Startups",
    description:
      "Explore healthcare startups building care workflows, provider tooling, diagnostics, and patient engagement platforms.",
    focus: "industry",
    industryKeywords: ["health", "healthcare", "clinical", "med", "hospital"],
  },
  {
    slug: "marketplace-startups",
    label: "Marketplace startups",
    title: "Marketplace Startups",
    description:
      "Discover marketplace startups with strong supply-demand dynamics and scalable platform economics.",
    focus: "industry",
    industryKeywords: ["marketplace", "platform", "two-sided", "commerce network"],
  },
  {
    slug: "saas-startups",
    label: "SaaS startups",
    title: "SaaS Startups",
    description:
      "Browse SaaS startups solving enterprise and SMB workflows with recurring-revenue software products.",
    focus: "industry",
    industryKeywords: ["saas", "software", "b2b software", "enterprise software"],
  },
  {
    slug: "sustainability-startups",
    label: "Sustainability startups",
    title: "Sustainability Startups",
    description:
      "Track sustainability startups in climate tech, clean systems, and long-term resource efficiency.",
    focus: "industry",
    industryKeywords: ["sustainability", "climate", "clean", "green", "energy transition"],
  },
  {
    slug: "early-stage-startups",
    label: "Early-stage startups",
    title: "Early-Stage Startups",
    description:
      "Explore early-stage startups from Seed and Series A with strong product and go-to-market momentum.",
    focus: "stage",
    stageGroup: "early",
  },
  {
    slug: "growth-stage-startups",
    label: "Growth-stage startups",
    title: "Growth-Stage Startups",
    description:
      "Browse growth-stage startups in Series B to Series D scaling teams, revenue, and market expansion.",
    focus: "stage",
    stageGroup: "growth",
  },
  {
    slug: "mature-startups",
    label: "Mature startups",
    title: "Mature Startups",
    description:
      "Find mature startups and late-stage companies with durable operating models and category leadership.",
    focus: "stage",
    stageGroup: "mature",
  },
  {
    slug: "under-50-employees",
    label: "Under 50 employees",
    title: "Startups Under 50 Employees",
    description:
      "Discover lean startup teams with fewer than 50 employees and high execution velocity.",
    focus: "size",
    maxEmployees: 50,
  },
  {
    slug: "under-100-employees",
    label: "Under 100 employees",
    title: "Startups Under 100 Employees",
    description:
      "Explore startups with compact teams under 100 employees across India and US ecosystems.",
    focus: "size",
    maxEmployees: 100,
  },
  {
    slug: "under-500-employees",
    label: "Under 500 employees",
    title: "Startups Under 500 Employees",
    description:
      "Track scale-up startups and growth companies with fewer than 500 employees.",
    focus: "size",
    maxEmployees: 500,
  },
  {
    slug: "founded-in-2021",
    label: "Founded in 2021",
    title: "Startups Founded in 2021",
    description:
      "Browse startups founded in 2021 and evaluate their funding and growth trajectory.",
    focus: "founded",
    foundedYear: 2021,
  },
  {
    slug: "founded-in-2020",
    label: "Founded in 2020",
    title: "Startups Founded in 2020",
    description:
      "Discover startups launched in 2020 and follow their progress into scale stages.",
    focus: "founded",
    foundedYear: 2020,
  },
  {
    slug: "remote-startups",
    label: "Remote Startups",
    title: "Remote Startups",
    description:
      "Find remote-first startups distributed across global talent hubs.",
    focus: "location",
    locationKeywords: ["remote"],
  },
  {
    slug: "united-states-startups",
    label: "United States startups",
    title: "United States Startups",
    description:
      "Browse recently funded startups across major US hubs including San Francisco, New York, Boston, Seattle, and Austin.",
    focus: "location",
    locationKeywords: US_LOCATION_KEYWORDS,
  },
  {
    slug: "startups-in-new-york",
    label: "Startups in New York",
    title: "Startups in New York",
    description:
      "Explore startup companies headquartered in New York across fintech, AI, and enterprise software.",
    focus: "location",
    locationKeywords: ["new york"],
  },
  {
    slug: "startups-in-chicago",
    label: "Startups in Chicago",
    title: "Startups in Chicago",
    description:
      "Explore Chicago startups across healthcare AI, fintech, and B2B software with funding momentum.",
    focus: "location",
    locationKeywords: ["chicago"],
  },
  {
    slug: "startups-in-boston",
    label: "Startups in Boston",
    title: "Startups in Boston",
    description:
      "Browse startups based in Boston, including healthcare, biotech, and deep-tech companies.",
    focus: "location",
    locationKeywords: ["boston"],
  },
  {
    slug: "startups-in-san-francisco",
    label: "Startups in San Francisco",
    title: "Startups in San Francisco",
    description:
      "Track San Francisco startups across AI infrastructure, developer tooling, and enterprise software.",
    focus: "location",
    locationKeywords: ["san francisco", "bay area"],
  },
  {
    slug: "startups-in-los-angeles",
    label: "Startups in Los Angeles",
    title: "Startups in Los Angeles",
    description:
      "Find startups in Los Angeles spanning media, defense tech, and consumer innovation.",
    focus: "location",
    locationKeywords: ["los angeles"],
  },
  {
    slug: "startups-in-seattle",
    label: "Startups in Seattle",
    title: "Startups in Seattle",
    description:
      "Explore Seattle startups building cloud, AI, and enterprise technology products.",
    focus: "location",
    locationKeywords: ["seattle"],
  },
  {
    slug: "startups-in-austin",
    label: "Startups in Austin",
    title: "Startups in Austin",
    description:
      "Discover Austin startups scaling software, security, and developer-first products.",
    focus: "location",
    locationKeywords: ["austin"],
  },
  {
    slug: "startups-in-miami",
    label: "Startups in Miami",
    title: "Startups in Miami",
    description:
      "Track Miami startups across fintech, hospitality tech, and climate-focused operating systems.",
    focus: "location",
    locationKeywords: ["miami"],
  },
  {
    slug: "startups-in-washington-dc",
    label: "Startups in Washington DC",
    title: "Startups in Washington DC",
    description:
      "Find Washington DC startups in climate intelligence, space infrastructure, and deep-tech sectors.",
    focus: "location",
    locationKeywords: ["washington", "dc"],
  },
  {
    slug: "startups-in-dallas",
    label: "Startups in Dallas",
    title: "Startups in Dallas",
    description:
      "Discover Dallas startups scaling fintech, field operations software, and AI infrastructure products.",
    focus: "location",
    locationKeywords: ["dallas"],
  },
  {
    slug: "startups-in-philadelphia",
    label: "Startups in Philadelphia",
    title: "Startups in Philadelphia",
    description:
      "Browse Philadelphia startups in quick commerce, pathology AI, and robotics security.",
    focus: "location",
    locationKeywords: ["philadelphia"],
  },
  {
    slug: "startups-in-san-diego",
    label: "Startups in San Diego",
    title: "Startups in San Diego",
    description:
      "Explore San Diego startups in biotech, drug discovery AI, and clinical innovation.",
    focus: "location",
    locationKeywords: ["san diego"],
  },
  {
    slug: "startups-in-houston",
    label: "Startups in Houston",
    title: "Startups in Houston",
    description:
      "Track Houston startups across commerce infrastructure, medtech, and industrial AI.",
    focus: "location",
    locationKeywords: ["houston"],
  },
  {
    slug: "startups-in-atlanta",
    label: "Startups in Atlanta",
    title: "Startups in Atlanta",
    description:
      "Find Atlanta startups building public safety technology, AI tooling, and enterprise automation.",
    focus: "location",
    locationKeywords: ["atlanta"],
  },
  {
    slug: "startups-in-denver",
    label: "Startups in Denver",
    title: "Startups in Denver",
    description:
      "Discover Denver startups focused on construction SaaS, oncology intelligence, and B2B operations.",
    focus: "location",
    locationKeywords: ["denver"],
  },
  {
    slug: "startups-in-india",
    label: "Startups in India",
    title: "Startups in India",
    description:
      "Browse Indian startups and founders across fintech, AI, commerce, and SaaS sectors.",
    focus: "location",
    locationKeywords: INDIA_LOCATION_KEYWORDS,
  },
  {
    slug: "startups-in-london",
    label: "Startups in London",
    title: "Startups in London",
    description:
      "Find London startups building fintech, enterprise software, and global infrastructure products.",
    focus: "location",
    locationKeywords: ["london"],
  },
  {
    slug: "startups-in-canada",
    label: "Startups in Canada",
    title: "Startups in Canada",
    description:
      "Explore Canadian startups with growth signals across AI, SaaS, and digital infrastructure.",
    focus: "location",
    locationKeywords: ["canada", "toronto", "vancouver", "montreal"],
  },
];

export function getStartupDiscoveryPage(slug: string): StartupDiscoveryPage | null {
  return STARTUP_DISCOVERY_PAGES.find((item) => item.slug === slug) ?? null;
}

export function getStartupDiscoverySlugs(): string[] {
  return STARTUP_DISCOVERY_PAGES.map((item) => item.slug);
}
