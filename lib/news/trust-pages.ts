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
          "Our newsroom prioritizes updates that change decision quality for founders, operators, investors, and market analysts, rather than short-lived social chatter.",
          "When the same event appears across multiple outlets, we consolidate the core signal into one structured summary and route readers to the source links.",
        ],
      },
      {
        heading: "Source Standards",
        points: [
          "Every publishable story must include at least one attributable source URL and source title.",
          "We do not republish full third-party articles; coverage is original synthesis with source attribution.",
          "If source claims conflict, we either add reconciliation context or delay publication until a reliable trail is available.",
          "Source links are preserved to support auditability, correction handling, and long-term editorial trust.",
        ],
      },
      {
        heading: "Review Workflow",
        points: [
          "AI-assisted drafts are reviewed by a human editor before publication.",
          "Fact-check status is tracked in the newsroom workflow and logged with article updates.",
          "Headlines, metadata, and internal links are reviewed for clarity so users can move from one story to related hubs without dead-end navigation.",
          "Major updates are appended with timestamps to maintain a clean chronology of what changed and why it changed.",
        ],
      },
      {
        heading: "Independence and commercial boundaries",
        points: [
          "Editorial decisions are made independently from promotional workflows. Sponsored submissions follow separate review lanes and are clearly controlled by policy.",
          "No payment guarantees publication. Every submission is evaluated on quality, relevance, and compliance with newsroom standards.",
          "If we cannot verify a key claim, we either remove the claim or reject publication until stronger evidence is provided.",
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
          "Minor grammar or formatting changes may be updated silently when they do not alter factual meaning.",
          "If an error materially impacts reader understanding, we add explicit correction language and preserve the correction timeline.",
        ],
      },
      {
        heading: "How To Request A Correction",
        points: [
          "Use /contact-newsroom with the article URL, error detail, and reliable source proof.",
          "Editorial team aims to review correction requests within 48 hours.",
          "Requests without source proof can still be reviewed, but actionable evidence speeds resolution and reduces back-and-forth.",
          "If your correction affects multiple related stories, include all affected URLs so updates can be applied consistently across pages.",
        ],
      },
      {
        heading: "Correction outcomes",
        points: [
          "Accepted corrections are implemented with updated timestamps and visible notes where required.",
          "Rejected requests receive a rationale when possible, especially when source quality or factual certainty remains unresolved.",
          "Repeat issues on the same topic may trigger a methodology review to improve future editorial checks.",
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
          "Topic clustering is used to group related stories so readers can compare signals without manually searching multiple routes.",
          "Country, stage, and industry mappings are normalized to reduce duplication and improve route consistency.",
        ],
      },
      {
        heading: "Quality Gates",
        points: [
          "Minimum content depth, citation checks, and editorial review are required before publish.",
          "Discover-readiness checks include metadata completeness, image quality, and source attribution.",
          "Templates are reviewed for crawlability and internal-link depth to ensure major hubs remain reachable in a few clicks.",
          "If content quality falls below useful depth, pages may remain live for users but be excluded from index-focused surfaces until expanded.",
        ],
      },
      {
        heading: "Update and maintenance model",
        points: [
          "Published pages are periodically reviewed for stale references, broken links, and outdated source context.",
          "When entities evolve through new rounds, leadership changes, or hiring shifts, linked pages are refreshed to preserve continuity.",
          "Methodology itself is updated as editorial systems improve, and those updates are reflected in trust pages and workflows.",
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
          "Build a reliable startup intelligence layer where stories, entities, and signals connect across consistent internal routes.",
          "Keep coverage practical: every article should help users make a clearer decision, not just consume another headline.",
        ],
      },
      {
        heading: "Editorial Focus",
        points: [
          "Funding and capital movement",
          "Founding team and leadership changes",
          "Hiring and growth signals by market and sector",
          "Cross-border startup movement between India and US ecosystems",
          "Market context that links article-level updates to founder and company profiles",
        ],
      },
      {
        heading: "What readers can expect",
        points: [
          "Source-attributed summaries with clear pathways to original reporting.",
          "Contextual internal links to topic hubs, country pages, stage routes, and startup directories.",
          "Consistent metadata and trust-page governance so both users and crawlers can interpret coverage quality.",
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
          "If your request is urgent, include why timing matters and which specific URL or entity needs immediate review.",
          "For content updates, provide the exact section and revised text suggestion to speed editorial processing.",
        ],
      },
      {
        heading: "Response Time",
        points: [
          "Corrections: usually within 48 hours.",
          "Editorial and collaboration requests: usually within 3 business days.",
          "Complex reviews involving multiple sources can take longer; status updates may be shared during review.",
          "Submission quality affects response speed. Requests with clean context and links are resolved faster.",
        ],
      },
      {
        heading: "Contact request checklist",
        points: [
          "Article URL or page URL that needs attention.",
          "Clear problem statement and expected resolution.",
          "Evidence links or citations supporting the request.",
        ],
      },
    ],
  },
};
