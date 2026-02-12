import type { FounderDirectoryItem } from "@/lib/founders/types";

export type ProfileFaq = {
  question: string;
  answer: string;
};

type FounderSchemaInput = {
  baseUrl: string;
  founder: FounderDirectoryItem;
  faqs: ProfileFaq[];
  pagePath?: string;
};

type CompanySchemaInput = {
  baseUrl: string;
  primary: FounderDirectoryItem;
  matches: FounderDirectoryItem[];
  faqs: ProfileFaq[];
};

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function toLocation(value: string | null | undefined): string {
  if (!value || !value.trim()) {
    return "India";
  }
  return value.trim();
}

function normalizeWebsite(value: string | null | undefined): string | null {
  if (!value || !value.trim()) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value.trim()}`;
}

function toNameList(values: string[]): string {
  if (values.length === 0) {
    return "not disclosed";
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

export function buildFounderFaqs(founder: FounderDirectoryItem): ProfileFaq[] {
  const location = toLocation(founder.headquarters);
  const techStack = founder.techStack.slice(0, 4);
  const today = formatDate();
  const contactHost = normalizeWebsite(founder.websiteUrl)
    ?.replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "") ?? "company domain";

  const faqs: ProfileFaq[] = [
    {
      question: `Who is ${founder.founderName}?`,
      answer: `${founder.founderName} is the founder profile listed on 100Xfounder for ${founder.companyName}, tracked for market signals, company intelligence, and operator-level context.`,
    },
    {
      question: `What does ${founder.companyName} do?`,
      answer: founder.productSummary,
    },
    {
      question: `Where is ${founder.companyName} based?`,
      answer: `${founder.companyName} is listed as operating from ${location}.`,
    },
    {
      question: `What is the current funding stage of ${founder.companyName}?`,
      answer: `${founder.companyName} is currently categorized at ${founder.stage} on 100Xfounder.${founder.fundingInfo ? ` Funding signal: ${founder.fundingInfo}` : ""}`,
    },
    {
      question: `Is ${founder.founderName}'s profile verified?`,
      answer: founder.verified
        ? `Yes. ${founder.founderName}'s profile is marked as verified on 100Xfounder as of ${today}.`
        : `The profile is currently pending verification status updates on 100Xfounder as of ${today}.`,
    },
    {
      question: `How can I connect with ${founder.founderName}?`,
      answer: `You can use the profile action buttons and listed links on 100Xfounder. Contact context is provided with business relevance and profile metadata for ${contactHost}.`,
    },
    {
      question: `What technologies are associated with ${founder.companyName}?`,
      answer: `${founder.companyName} is associated with ${toNameList(techStack)} based on current profile intelligence.`,
    },
  ];

  if (founder.ycProfileUrl) {
    faqs.push({
      question: `Is ${founder.founderName} linked to Y Combinator founder data?`,
      answer: `Yes. This profile includes a related Y Combinator founder reference for ${founder.founderName}.`,
    });
  }

  return faqs;
}

export function buildCompanyFaqs(
  primary: FounderDirectoryItem,
  matches: FounderDirectoryItem[],
): ProfileFaq[] {
  const location = toLocation(primary.headquarters);
  const founders = Array.from(new Set(matches.map((item) => item.founderName))).slice(0, 5);
  const techStack = primary.techStack.slice(0, 5);
  const today = formatDate();

  return [
    {
      question: `What is ${primary.companyName}?`,
      answer: primary.productSummary,
    },
    {
      question: `Who founded ${primary.companyName}?`,
      answer: `${primary.companyName} is associated with ${toNameList(founders)} on 100Xfounder.`,
    },
    {
      question: `Where is ${primary.companyName} located?`,
      answer: `${primary.companyName} is listed in ${location}.`,
    },
    {
      question: `What stage is ${primary.companyName} in?`,
      answer: `${primary.companyName} is currently mapped to ${primary.stage}.${primary.fundingInfo ? ` Funding context: ${primary.fundingInfo}` : ""}`,
    },
    {
      question: `What technologies does ${primary.companyName} use?`,
      answer: `${primary.companyName} is associated with ${toNameList(techStack)}.`,
    },
    {
      question: `Is ${primary.companyName} verified on 100Xfounder?`,
      answer: primary.verified
        ? `Yes. ${primary.companyName} is currently marked verified on 100Xfounder as of ${today}.`
        : `${primary.companyName} is currently pending verification updates on 100Xfounder as of ${today}.`,
    },
    {
      question: `How can users connect with ${primary.companyName} founders?`,
      answer: `Users can open founder profiles, use listed company links, and track signal updates directly from the 100Xfounder directory.`,
    },
  ];
}

function toFaqMainEntity(faqs: ProfileFaq[]) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}

export function buildFounderProfileSchema(input: FounderSchemaInput) {
  const { baseUrl, founder, faqs } = input;
  const canonicalPath = input.pagePath ?? `/founders/${founder.slug}`;
  const founderUrl = `${baseUrl}${canonicalPath}`;
  const companyUrl = `${baseUrl}/company/${founder.companySlug}`;
  const websiteUrl = normalizeWebsite(founder.websiteUrl);
  const sameAs = [founder.linkedinUrl, founder.twitterUrl, founder.ycProfileUrl].filter(Boolean);
  const location = toLocation(founder.headquarters);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: "100Xfounder",
        url: baseUrl,
      },
      {
        "@type": "Person",
        "@id": `${founderUrl}#person`,
        name: founder.founderName,
        url: founderUrl,
        image: founder.avatarUrl ?? undefined,
        description: founder.productSummary,
        jobTitle: `Founder at ${founder.companyName}`,
        worksFor: { "@id": `${companyUrl}#org` },
        sameAs: sameAs.length > 0 ? sameAs : undefined,
        knowsAbout: [founder.industry, ...founder.techStack].filter(Boolean),
        address: {
          "@type": "PostalAddress",
          addressLocality: location,
          addressCountry: "IN",
        },
      },
      {
        "@type": "Organization",
        "@id": `${companyUrl}#org`,
        name: founder.companyName,
        url: websiteUrl ?? companyUrl,
        description: founder.productSummary,
        founder: { "@id": `${founderUrl}#person` },
        address: {
          "@type": "PostalAddress",
          addressLocality: location,
          addressCountry: "IN",
        },
        sameAs: [websiteUrl, founder.linkedinUrl, founder.twitterUrl].filter(Boolean),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${founderUrl}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Founder Directory",
            item: `${baseUrl}/founders`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: founder.founderName,
            item: founderUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${founderUrl}#webpage`,
        url: founderUrl,
        name: `${founder.founderName} - Founder Profile | 100Xfounder`,
        description: `Profile, funding, and growth signals for ${founder.founderName} and ${founder.companyName}.`,
        isPartOf: { "@id": `${baseUrl}/#website` },
        about: [{ "@id": `${founderUrl}#person` }, { "@id": `${companyUrl}#org` }],
        breadcrumb: { "@id": `${founderUrl}#breadcrumbs` },
      },
      {
        "@type": "FAQPage",
        "@id": `${founderUrl}#faq`,
        mainEntity: toFaqMainEntity(faqs),
      },
    ],
  };
}

export function buildCompanyProfileSchema(input: CompanySchemaInput) {
  const { baseUrl, primary, matches, faqs } = input;
  const companyUrl = `${baseUrl}/company/${primary.companySlug}`;
  const websiteUrl = normalizeWebsite(primary.websiteUrl);
  const location = toLocation(primary.headquarters);
  const uniqueFounders = Array.from(new Map(
    matches.map((item) => [item.founderName.toLowerCase(), item]),
  ).values()).slice(0, 6);

  const peopleSchemas = uniqueFounders.map((item) => ({
    "@type": "Person",
    "@id": `${baseUrl}/founders/${item.slug}#person`,
    name: item.founderName,
    url: `${baseUrl}/founders/${item.slug}`,
    image: item.avatarUrl ?? undefined,
    jobTitle: `Founder at ${item.companyName}`,
    sameAs: [item.linkedinUrl, item.twitterUrl, item.ycProfileUrl].filter(Boolean),
    worksFor: { "@id": `${companyUrl}#org` },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        name: "100Xfounder",
        url: baseUrl,
      },
      {
        "@type": "Organization",
        "@id": `${companyUrl}#org`,
        name: primary.companyName,
        url: websiteUrl ?? companyUrl,
        description: primary.productSummary,
        founder: peopleSchemas.map((person) => ({ "@id": person["@id"] })),
        address: {
          "@type": "PostalAddress",
          addressLocality: location,
          addressCountry: "IN",
        },
        sameAs: [websiteUrl, primary.linkedinUrl, primary.twitterUrl].filter(Boolean),
      },
      ...peopleSchemas,
      {
        "@type": "BreadcrumbList",
        "@id": `${companyUrl}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Founder Directory",
            item: `${baseUrl}/founders`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: primary.companyName,
            item: companyUrl,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${companyUrl}#webpage`,
        url: companyUrl,
        name: `${primary.companyName} - Company Profile | 100Xfounder`,
        description: `Company profile, founder details, and market signals for ${primary.companyName}.`,
        isPartOf: { "@id": `${baseUrl}/#website` },
        about: [{ "@id": `${companyUrl}#org` }],
        breadcrumb: { "@id": `${companyUrl}#breadcrumbs` },
      },
      {
        "@type": "FAQPage",
        "@id": `${companyUrl}#faq`,
        mainEntity: toFaqMainEntity(faqs),
      },
    ],
  };
}

