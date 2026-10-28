export type OutreachTemplateInput = {
  firstName: string | null;
  productName: string;
  tagline: string;
  votesCount: number;
  listingUrl: string;
  featureUrl: string;
  unsubscribeUrl: string;
  fromName: string;
  postalAddress: string;
};

export const OUTREACH_STEP_COUNT = 3;

function footer(input: OutreachTemplateInput): string {
  const lines = [
    "--",
    `You're getting this because ${input.productName} launched publicly on Product Hunt.`,
    `Don't want to hear from us again? ${input.unsubscribeUrl}`,
  ];
  if (input.postalAddress) {
    lines.push(input.postalAddress);
  }
  return lines.join("\n");
}

function greeting(input: OutreachTemplateInput): string {
  return `Hi ${input.firstName || "there"},`;
}

/**
 * Plain-text bodies only: they read as personal notes and deliver better than
 * HTML for one-to-one outreach. Steps 1 and 2 are sent as replies in the same thread.
 */
export function renderOutreachEmail(step: number, input: OutreachTemplateInput): { subject: string; body: string } {
  const firstSubject = `${input.productName} is now listed on 100xFounder`;
  const votes = input.votesCount >= 50 ? ` (${input.votesCount} upvotes, nice work)` : "";

  if (step === 0) {
    return {
      subject: firstSubject,
      body: [
        greeting(input),
        "",
        `Congrats on launching ${input.productName} on Product Hunt${votes}. "${input.tagline}" stood out, and it made our pick of the day's top launches.`,
        "",
        `We've listed it on 100xFounder, a directory of new startups: ${input.listingUrl}`,
        "",
        `We'd also love to feature you in a free founder spotlight: a short story about why you built ${input.productName}, published on our site and shared on our Instagram (@100x.founder). It takes about 5 minutes:`,
        input.featureUrl,
        "",
        "No cost and no catch. If it's not for you, just ignore this email.",
        "",
        input.fromName,
        "100xFounder",
        "",
        footer(input),
      ].join("\n"),
    };
  }

  if (step === 1) {
    return {
      subject: `Re: ${firstSubject}`,
      body: [
        greeting(input),
        "",
        `Quick follow-up: your free founder spotlight for ${input.productName} is still open. Founders use it to tell their story and get a backlink plus an Instagram feature.`,
        "",
        input.featureUrl,
        "",
        input.fromName,
        "",
        footer(input),
      ].join("\n"),
    };
  }

  return {
    subject: `Re: ${firstSubject}`,
    body: [
      greeting(input),
      "",
      `Last note from me. If you'd like ${input.productName} featured in a founder spotlight, the form is here whenever you're ready:`,
      input.featureUrl,
      "",
      "Either way, good luck with the launch!",
      "",
      input.fromName,
      "",
      footer(input),
    ].join("\n"),
  };
}
