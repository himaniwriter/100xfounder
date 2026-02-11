export type FounderDirectoryItem = {
  id: string;
  slug: string;
  founderName: string;
  companyName: string;
  foundedYear: number | null;
  headquarters: string | null;
  industry: string;
  stage: string;
  productSummary: string;
  fundingInfo: string | null;
  sourceUrl: string;
  ycProfileUrl: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

export type FounderSyncInput = {
  founderName: string;
  companyName: string;
  foundedYear?: number | null;
  headquarters?: string | null;
  industry?: string;
  stage?: string;
  productSummary: string;
  fundingInfo?: string | null;
  sourceUrl?: string;
  ycProfileUrl?: string | null;
  verified?: boolean;
  avatarUrl?: string | null;
  slug?: string;
};
