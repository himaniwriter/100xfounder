export type BlogPostCitation = {
  id?: string;
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string;
  quotedClaim?: string | null;
  createdAt?: string;
};

export type BlogPostUpdate = {
  id?: string;
  changeType: string;
  note?: string | null;
  changedBy?: string | null;
  createdAt?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  readingTime: string;
  thumbnail: string;
  imageCredit?: string;
  wordCount?: number;
  articleType?: string;
  topicSlug?: string;
  authorId?: string | null;
  canonicalUrl?: string;
  sourceUrls?: string[];
  factCheckStatus?: string;
  correctionNote?: string;
  discoverReady?: boolean;
  socialImageUrl?: string;
  publishedAt: string;
  isFeatured: boolean;
  isTrending: boolean;
  author: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "DRAFT" | "PUBLISHED";
  seoTitle?: string;
  seoDescription?: string;
  citations?: BlogPostCitation[];
  updates?: BlogPostUpdate[];
  faqSchema?: Record<string, unknown> | null;
  howtoSchema?: Record<string, unknown> | null;
  faqAdded?: boolean;
  howtoAdded?: boolean;
};

export type BlogHeading = {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
};
