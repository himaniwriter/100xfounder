import { ensureBlogPostsSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

export type NewsAuthor = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  role: string;
  avatarUrl?: string;
  sameAs: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const FALLBACK_AUTHORS: NewsAuthor[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "100Xfounder Research Desk",
    slug: "100xfounder-research-desk",
    bio: "Newsroom team covering startup funding, founder moves, and market shifts across India and the US.",
    role: "Editorial Team",
    avatarUrl: undefined,
    sameAs: [],
    isActive: true,
    createdAt: new Date("2026-01-01").toISOString(),
    updatedAt: new Date("2026-01-01").toISOString(),
  },
];

function normalizeSameAs(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export async function getNewsAuthors(): Promise<NewsAuthor[]> {
  if (!isDatabaseConfigured()) {
    return FALLBACK_AUTHORS;
  }

  try {
    await ensureBlogPostsSchema();
    const authors = await prisma.author.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    if (authors.length === 0) {
      return FALLBACK_AUTHORS;
    }

    return authors.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      bio:
        item.bio?.trim() ||
        "Contributor covering startup intelligence, founder stories, and funding movement.",
      role: item.role?.trim() || "Contributor",
      avatarUrl: item.avatarUrl ?? undefined,
      sameAs: normalizeSameAs(item.sameAsJson),
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } catch {
    return FALLBACK_AUTHORS;
  }
}

export async function getNewsAuthorBySlug(slug: string): Promise<NewsAuthor | null> {
  const authors = await getNewsAuthors();
  return authors.find((author) => author.slug === slug) ?? null;
}
