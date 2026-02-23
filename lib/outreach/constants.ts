export const INTERVIEW_QUESTIONS: Array<{ key: string; label: string; placeholder: string }> = [
  {
    key: "personal_background",
    label: "Personal Background",
    placeholder:
      "Full name, current role, educational background, and your career journey into the founder/CEO role.",
  },
  {
    key: "leadership_management",
    label: "Leadership and Management",
    placeholder:
      "Your leadership style, principles, team motivation approach, and one difficult decision with outcomes.",
  },
  {
    key: "industry_insights",
    label: "Industry Insights",
    placeholder:
      "Most important market trends, your competitive edge, and advice for aspiring leaders.",
  },
  {
    key: "innovation_strategy",
    label: "Innovation and Strategy",
    placeholder:
      "How your company drives innovation and the growth strategies that have worked best.",
  },
  {
    key: "challenges_lessons",
    label: "Challenges and Lessons",
    placeholder:
      "Biggest challenges in your journey and one lesson you wish you had learned earlier.",
  },
  {
    key: "csr_sustainability",
    label: "CSR and Sustainability",
    placeholder:
      "How your company approaches social impact/sustainability and notable initiatives.",
  },
  {
    key: "work_life_balance",
    label: "Work-Life Balance",
    placeholder: "How you maintain work-life balance as a founder or CEO.",
  },
  {
    key: "future_ceo_advice",
    label: "Advice for Future CEOs",
    placeholder: "Practical advice for people aspiring to become founders/CEOs.",
  },
  {
    key: "projects_future_plans",
    label: "Current Projects and Future Plans",
    placeholder: "What are you building right now and where is the company headed in 5-10 years?",
  },
  {
    key: "personal_interests",
    label: "Personal Interests",
    placeholder: "Hobbies, books, principles, or philosophies that shape how you lead.",
  },
  {
    key: "closing_remarks",
    label: "Closing Remarks",
    placeholder: "Final message to readers and any upcoming milestones or announcements.",
  },
];

export const GUEST_POST_PACKAGES = [
  {
    key: "starter",
    label: "Starter Distribution",
    priceInr: 9900,
    priceUsd: 149,
    deliverables: [
      "Newsroom article placement",
      "Basic SEO formatting and metadata",
      "One revision round",
      "48-hour editorial response",
    ],
  },
  {
    key: "growth",
    label: "Growth Distribution",
    priceInr: 24900,
    priceUsd: 349,
    deliverables: [
      "Priority newsroom placement",
      "Internal link optimization",
      "Two revision rounds",
      "24-hour editorial response",
    ],
  },
  {
    key: "priority",
    label: "Priority Spotlight",
    priceInr: 49900,
    priceUsd: 699,
    deliverables: [
      "Homepage spotlight window",
      "Newsroom + social distribution mention",
      "Two updates within 30 days",
      "Same-day editorial response",
    ],
  },
] as const;

export const REQUEST_STATUSES = [
  "new",
  "in_review",
  "approved",
  "rejected",
  "published",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
