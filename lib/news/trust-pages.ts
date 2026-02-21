export type NewsroomPageContent = {
  title: string;
  description: string;
  sections: Array<{
    heading: string;
    points: string[];
  }>;
};

export const NEWSROOM_TRUST_PAGES: Record<string, NewsroomPageContent> = {
  "editorial-policy": {
    title: "Editorial Policy",
    description:
      "How 100Xfounder newsroom selects stories, verifies information, and maintains editorial independence.",
    sections: [
      {
        heading: "Coverage Scope",
        points: [
          "We cover startup funding, founder movement, GTM pivots, and high-signal hiring updates in India and the US.",
          "Stories are selected based on reader utility, market relevance, and verifiable primary sources.",
        ],
      },
      {
        heading: "Source Standards",
        points: [
          "Every publishable story must include at least one attributable source URL and source title.",
          "We do not republish full third-party articles; coverage is original synthesis with source attribution.",
        ],
      },
      {
        heading: "Review Workflow",
        points: [
          "AI-assisted drafts are reviewed by a human editor before publication.",
          "Fact-check status is tracked in the newsroom workflow and logged with article updates.",
        ],
      },
    ],
  },
  "corrections-policy": {
    title: "Corrections Policy",
    description:
      "How 100Xfounder newsroom handles factual corrections, updates, and transparency logs.",
    sections: [
      {
        heading: "When We Correct",
        points: [
          "If a factual error is identified, we update the article and add a correction note.",
          "Material corrections are timestamped in the newsroom update log.",
        ],
      },
      {
        heading: "How To Request A Correction",
        points: [
          "Use /contact-newsroom with the article URL, error detail, and reliable source proof.",
          "Editorial team aims to review correction requests within 48 hours.",
        ],
      },
    ],
  },
  methodology: {
    title: "Methodology",
    description:
      "How data points, source citations, and startup intelligence context are assembled for newsroom stories.",
    sections: [
      {
        heading: "Data Assembly",
        points: [
          "Funding, stage, and hiring details are reconciled using source references and internal entity data.",
          "Entity mapping connects story coverage to company and founder profile pages when available.",
        ],
      },
      {
        heading: "Quality Gates",
        points: [
          "Minimum content depth, citation checks, and editorial review are required before publish.",
          "Discover-readiness checks include metadata completeness, image quality, and source attribution.",
        ],
      },
    ],
  },
  "about-newsroom": {
    title: "About Newsroom",
    description:
      "100Xfounder Newsroom publishes startup intelligence and founder coverage with strong source transparency.",
    sections: [
      {
        heading: "Mission",
        points: [
          "Make startup news easier to verify, compare, and act on without opening multiple websites.",
          "Prioritize decision-useful coverage for operators, founders, and investors.",
        ],
      },
      {
        heading: "Editorial Focus",
        points: [
          "Funding and capital movement",
          "Founding team and leadership changes",
          "Hiring and growth signals by market and sector",
        ],
      },
    ],
  },
  "contact-newsroom": {
    title: "Contact Newsroom",
    description:
      "Reach the editorial team for corrections, source clarifications, or partnership opportunities.",
    sections: [
      {
        heading: "Best Way To Reach Us",
        points: [
          "Send article feedback and correction requests with source URLs and context.",
          "For partnerships, include target use case and timeline in your request.",
        ],
      },
      {
        heading: "Response Time",
        points: [
          "Corrections: usually within 48 hours.",
          "Editorial and collaboration requests: usually within 3 business days.",
        ],
      },
    ],
  },
};
