export type SearchResultType = "founder" | "company" | "blog" | "signal" | "topic";

export type SearchFounderResult = {
  slug: string;
  founderName: string;
  companyName: string;
  companySlug: string;
  industry: string;
  stage: string;
  country: string;
};

export type SearchCompanyResult = {
  companySlug: string;
  companyName: string;
  founderName: string;
  industry: string;
  stage: string;
  country: string;
  funding: string;
};

export type SearchBlogResult = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
};

export type SearchSignalResult = {
  id: string;
  companyName: string;
  founderName: string;
  companySlug: string;
  industry: string;
  stage: string;
  country: string;
  fundingTotal: string;
  lastRound: string;
  isHiring: boolean;
};

export type SearchTopicResult = {
  slug: string;
  label: string;
  count: number;
  lastPublishedAt: string;
};

export type SearchApiResponse = {
  success: true;
  query: string;
  results: {
    founders: SearchFounderResult[];
    companies: SearchCompanyResult[];
    posts: SearchBlogResult[];
    signals: SearchSignalResult[];
    topics: SearchTopicResult[];
  };
  total: number;
};
