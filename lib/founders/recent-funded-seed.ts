import type { FounderDirectoryItem } from "@/lib/founders/types";

type RecentFundedSeedInput = {
  founderName: string;
  companyName: string;
  foundedYear: number;
  headquarters: string;
  industry: string;
  stage: "Series B" | "Series C" | "Series D";
  productSummary: string;
  fundingInfo: string;
  websiteUrl: string;
  employeeCount: string;
  techStack: string[];
  recentNews: string[];
  isFeatured?: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toDirectoryItem(
  input: RecentFundedSeedInput,
  index: number,
): FounderDirectoryItem {
  const founderSlug = slugify(input.founderName);
  const companySlug = slugify(input.companyName);

  return {
    id: `recent-funded-${index + 1}-${companySlug}`,
    slug: `${founderSlug}-${companySlug}`,
    companySlug,
    founderName: input.founderName,
    companyName: input.companyName,
    foundedYear: input.foundedYear,
    headquarters: input.headquarters,
    industry: input.industry,
    stage: input.stage,
    productSummary: input.productSummary,
    fundingInfo: input.fundingInfo,
    sourceUrl: "https://100xfounder.com/signals",
    ycProfileUrl: `https://www.ycombinator.com/founders?query=${encodeURIComponent(input.companyName)}`,
    websiteUrl: input.websiteUrl,
    employeeCount: input.employeeCount,
    techStack: input.techStack,
    recentNews: input.recentNews,
    linkedinUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(input.founderName)}`,
    twitterUrl: `https://x.com/search?q=${encodeURIComponent(input.companyName)}`,
    verified: true,
    isFeatured: input.isFeatured ?? false,
    avatarUrl: null,
  };
}

const RECENT_FUNDED_INPUT: RecentFundedSeedInput[] = [
  {
    founderName: "Aadit Palicha",
    companyName: "Zepto",
    foundedYear: 2021,
    headquarters: "Bangalore",
    industry: "Quick Commerce",
    stage: "Series D",
    productSummary: "Instant grocery and essentials delivery platform for urban consumers.",
    fundingInfo: "$200M Series D signal tracked from market sources.",
    websiteUrl: "https://www.zeptonow.com",
    employeeCount: "5,000+",
    techStack: ["React", "Node.js", "PostgreSQL", "AWS"],
    recentNews: [
      "Zepto expands dark-store footprint in major metro cities.",
      "Operations and delivery efficiency metrics improved quarter-over-quarter.",
    ],
    isFeatured: true,
  },
  {
    founderName: "Vivek Raghavan",
    companyName: "Sarvam AI",
    foundedYear: 2023,
    headquarters: "Bangalore",
    industry: "AI Infrastructure",
    stage: "Series B",
    productSummary: "Indian language AI models and enterprise LLM infrastructure stack.",
    fundingInfo: "$41M Series B signal tracked from market sources.",
    websiteUrl: "https://www.sarvam.ai",
    employeeCount: "100-250",
    techStack: ["Python", "PyTorch", "Kubernetes", "GCP"],
    recentNews: [
      "Sarvam AI announced expanded enterprise copilots for multilingual workflows.",
      "Model evaluation stack updated for low-latency inference.",
    ],
    isFeatured: true,
  },
  {
    founderName: "Vimal Kumar",
    companyName: "Juspay",
    foundedYear: 2012,
    headquarters: "Bangalore",
    industry: "Fintech Infrastructure",
    stage: "Series C",
    productSummary: "Payments orchestration and checkout infrastructure for digital businesses.",
    fundingInfo: "$60M Series C signal tracked from market sources.",
    websiteUrl: "https://juspay.in",
    employeeCount: "500-1,000",
    techStack: ["Java", "Kotlin", "Redis", "AWS"],
    recentNews: [
      "Juspay broadened UPI and card-routing optimization capabilities.",
      "Enterprise merchants increased adoption of smart retry flows.",
    ],
  },
  {
    founderName: "Sabyasachi Goswami",
    companyName: "Perfios",
    foundedYear: 2008,
    headquarters: "Bangalore",
    industry: "Fintech SaaS",
    stage: "Series D",
    productSummary: "BFSI data intelligence and underwriting automation platform.",
    fundingInfo: "$80M Series D signal tracked from market sources.",
    websiteUrl: "https://www.perfios.com",
    employeeCount: "1,000+",
    techStack: ["Java", "Python", "Snowflake", "Azure"],
    recentNews: [
      "Perfios expanded risk analytics deployments in lending institutions.",
      "Cross-border fintech integrations strengthened in APAC.",
    ],
  },
  {
    founderName: "Saurabh Agarwal",
    companyName: "Lentra",
    foundedYear: 2018,
    headquarters: "Bangalore",
    industry: "Lending Infrastructure",
    stage: "Series C",
    productSummary: "Cloud-native loan lifecycle and credit decisioning platform.",
    fundingInfo: "$120M Series C signal tracked from market sources.",
    websiteUrl: "https://lentra.ai",
    employeeCount: "500-1,000",
    techStack: ["React", "Java", "PostgreSQL", "AWS"],
    recentNews: [
      "Lentra added new loan origination modules for enterprise banks.",
      "Platform adoption increased among NBFC and fintech lenders.",
    ],
  },
  {
    founderName: "Tejinder Gill",
    companyName: "AppsForBharat",
    foundedYear: 2020,
    headquarters: "Bangalore",
    industry: "Consumer Internet",
    stage: "Series B",
    productSummary: "Faith-tech platform focused on devotional experiences and spiritual content.",
    fundingInfo: "$18M Series B signal tracked from market sources.",
    websiteUrl: "https://www.appsforbharat.com",
    employeeCount: "100-250",
    techStack: ["React Native", "Node.js", "MongoDB", "GCP"],
    recentNews: [
      "AppsForBharat expanded premium devotional offerings and creator partnerships.",
      "User growth remains strong across mobile-first cohorts.",
    ],
  },
  {
    founderName: "Gaurav Singh Kushwaha",
    companyName: "BlueStone",
    foundedYear: 2011,
    headquarters: "Bangalore",
    industry: "D2C Commerce",
    stage: "Series C",
    productSummary: "Omnichannel jewelry commerce brand with digital-first discovery.",
    fundingInfo: "$30M Series C signal tracked from market sources.",
    websiteUrl: "https://www.bluestone.com",
    employeeCount: "1,000+",
    techStack: ["React", "Node.js", "MySQL", "AWS"],
    recentNews: [
      "BlueStone expanded offline experience stores in high-demand zones.",
      "D2C conversion rates improved through personalization pipelines.",
    ],
  },
  {
    founderName: "Shashank Kumar",
    companyName: "Razorpay",
    foundedYear: 2014,
    headquarters: "Bangalore",
    industry: "Fintech",
    stage: "Series D",
    productSummary: "Payments and business banking stack for startups and enterprises.",
    fundingInfo: "$100M Series D signal tracked from market sources.",
    websiteUrl: "https://razorpay.com",
    employeeCount: "2,000+",
    techStack: ["Go", "Kubernetes", "Kafka", "AWS"],
    recentNews: [
      "Razorpay expanded lending and merchant settlement capabilities.",
      "Enterprise volume growth remained strong across verticals.",
    ],
    isFeatured: true,
  },
  {
    founderName: "Jaydeep Barman",
    companyName: "Rebel Foods",
    foundedYear: 2015,
    headquarters: "Mumbai",
    industry: "FoodTech",
    stage: "Series C",
    productSummary: "Cloud kitchen and digital-first food brand platform.",
    fundingInfo: "$75M Series C signal tracked from market sources.",
    websiteUrl: "https://www.rebelfoods.com",
    employeeCount: "1,000+",
    techStack: ["React", "Python", "PostgreSQL", "GCP"],
    recentNews: [
      "Rebel Foods launched additional brands in high-growth corridors.",
      "Delivery and repeat-order retention metrics improved.",
    ],
  },
  {
    founderName: "Sujeet Kumar",
    companyName: "Udaan",
    foundedYear: 2016,
    headquarters: "Bangalore",
    industry: "B2B Commerce",
    stage: "Series D",
    productSummary: "B2B commerce and supply chain platform for retailers and SMEs.",
    fundingInfo: "$120M Series D signal tracked from market sources.",
    websiteUrl: "https://udaan.com",
    employeeCount: "3,000+",
    techStack: ["Java", "React", "Kafka", "AWS"],
    recentNews: [
      "Udaan scaled category depth in FMCG and electronics segments.",
      "New credit products saw increased penetration among merchants.",
    ],
  },
  {
    founderName: "Sankar Bora",
    companyName: "DealShare",
    foundedYear: 2018,
    headquarters: "Jaipur",
    industry: "Ecommerce",
    stage: "Series B",
    productSummary: "Value-focused social commerce and grocery buying platform.",
    fundingInfo: "$25M Series B signal tracked from market sources.",
    websiteUrl: "https://www.dealshare.in",
    employeeCount: "500-1,000",
    techStack: ["React Native", "Node.js", "Redis", "AWS"],
    recentNews: [
      "DealShare expanded city-level logistics partnerships.",
      "Mobile conversion rates improved through assortment optimization.",
    ],
  },
  {
    founderName: "Adhil Shetty",
    companyName: "BankBazaar",
    foundedYear: 2008,
    headquarters: "Chennai",
    industry: "Fintech",
    stage: "Series C",
    productSummary: "Consumer financial marketplace for credit products and advisory.",
    fundingInfo: "$45M Series C signal tracked from market sources.",
    websiteUrl: "https://www.bankbazaar.com",
    employeeCount: "500-1,000",
    techStack: ["Java", "React", "Elasticsearch", "AWS"],
    recentNews: [
      "BankBazaar improved lender integrations for faster approvals.",
      "Digital onboarding completion rates increased in recent cohorts.",
    ],
  },
];

export const RECENT_FUNDED_SEED: FounderDirectoryItem[] = RECENT_FUNDED_INPUT.map(
  toDirectoryItem,
);
