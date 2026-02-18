export type FeaturedPlanKey = "starter" | "growth" | "priority";

export type FeaturedRequestStatusKey =
  | "new"
  | "in_review"
  | "approved"
  | "rejected"
  | "published";

export type FeaturedPlanDetails = {
  key: FeaturedPlanKey;
  label: string;
  priceInr: number;
  priceUsd: number;
  description: string;
  deliverables: string[];
};

export const FEATURED_PLANS: FeaturedPlanDetails[] = [
  {
    key: "starter",
    label: "Starter",
    priceInr: 9900,
    priceUsd: 149,
    description: "For early-stage founders who want a verified listing.",
    deliverables: [
      "Founder + company listing in directory",
      "Basic verification badge",
      "Review SLA: up to 7 days",
      "Inclusion in one distribution mention",
      "No revision cycle included",
    ],
  },
  {
    key: "growth",
    label: "Growth",
    priceInr: 24900,
    priceUsd: 349,
    description: "For growth-stage teams that need stronger profile visibility.",
    deliverables: [
      "Everything in Starter",
      "Priority review SLA: up to 3 days",
      "Higher listing visibility placement",
      "Extended visibility window",
      "One listing content update cycle",
    ],
  },
  {
    key: "priority",
    label: "Priority",
    priceInr: 49900,
    priceUsd: 699,
    description: "For founders who want fastest turnaround and spotlight visibility.",
    deliverables: [
      "Everything in Growth",
      "Fast-track review SLA: up to 24 hours",
      "Spotlight placement window",
      "Priority distribution mentions",
      "Two listing content update cycles",
    ],
  },
];

export const FEATURED_PLAN_BY_KEY: Record<FeaturedPlanKey, FeaturedPlanDetails> =
  FEATURED_PLANS.reduce(
    (acc, plan) => {
      acc[plan.key] = plan;
      return acc;
    },
    {} as Record<FeaturedPlanKey, FeaturedPlanDetails>,
  );

export function featuredPlanToDbValue(plan: FeaturedPlanKey): "STARTER" | "GROWTH" | "PRIORITY" {
  if (plan === "starter") {
    return "STARTER";
  }
  if (plan === "growth") {
    return "GROWTH";
  }
  return "PRIORITY";
}

export function featuredPlanFromDbValue(plan: string): FeaturedPlanKey {
  if (plan === "STARTER" || plan === "starter") {
    return "starter";
  }
  if (plan === "GROWTH" || plan === "growth") {
    return "growth";
  }
  return "priority";
}

export function featuredStatusToDbValue(
  status: FeaturedRequestStatusKey,
):
  | "NEW"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED" {
  if (status === "new") return "NEW";
  if (status === "in_review") return "IN_REVIEW";
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "PUBLISHED";
}

export function featuredStatusFromDbValue(status: string): FeaturedRequestStatusKey {
  if (status === "NEW" || status === "new") return "new";
  if (status === "IN_REVIEW" || status === "in_review") return "in_review";
  if (status === "APPROVED" || status === "approved") return "approved";
  if (status === "REJECTED" || status === "rejected") return "rejected";
  return "published";
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FEATURED_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "How long does profile review take?",
    answer:
      "Review timelines depend on your selected plan. Starter: up to 7 days, Growth: up to 3 days, Priority: up to 24 hours.",
  },
  {
    question: "What can lead to rejection?",
    answer:
      "Incomplete data, unverifiable company information, misleading claims, and non-startup submissions can be rejected during review.",
  },
  {
    question: "When is payment requested?",
    answer:
      "After application review, approved submissions receive payment instructions through your provided work email.",
  },
  {
    question: "Can I request refunds?",
    answer:
      "Please review our Fulfillment Policy for refund eligibility and service terms before submission.",
  },
];
