export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  thumbnail: string;
  publishedAt: string;
  isFeatured: boolean;
  isTrending: boolean;
  author: string;
  content: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  status?: "DRAFT" | "PUBLISHED";
  seoTitle?: string;
  seoDescription?: string;
};

export type BlogHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};
