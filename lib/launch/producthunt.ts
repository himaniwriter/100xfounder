import { getLaunchSelectionConfig, getProductHuntToken } from "@/lib/launch/config";

const PRODUCT_HUNT_GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql";
const PRODUCT_HUNT_TIME_ZONE = "America/Los_Angeles";
const PAGE_SIZE = 20;
const MAX_PAGES = 5;

export type ProductHuntPost = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  url: string;
  website: string | null;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  featuredAt: string | null;
  thumbnailUrl: string | null;
  topics: string[];
};

export type SelectedLaunch = ProductHuntPost & {
  dailyRank: number | null;
  selectionReasons: string[];
};

// Maker names and emails are redacted by the Product Hunt API, so the query only
// asks for public product data. Contacts are discovered from the product website.
const POSTS_QUERY = `
query DailyPosts($postedAfter: DateTime!, $postedBefore: DateTime!, $after: String) {
  posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore, first: ${PAGE_SIZE}, after: $after) {
    edges {
      node {
        id
        name
        slug
        tagline
        description
        url
        website
        votesCount
        commentsCount
        createdAt
        featuredAt
        thumbnail { url }
        topics(first: 5) { edges { node { name } } }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}
`;

type PostsResponse = {
  data?: {
    posts: {
      edges: Array<{
        node: Omit<ProductHuntPost, "thumbnailUrl" | "topics"> & {
          thumbnail: { url: string } | null;
          topics: { edges: Array<{ node: { name: string } }> };
        };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
  errors?: Array<{ message: string }>;
};

function timeZoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - at.getTime();
}

function startOfDayInZone(year: number, month: number, day: number, timeZone: string): Date {
  const guess = new Date(Date.UTC(year, month - 1, day));
  return new Date(guess.getTime() - timeZoneOffsetMs(guess, timeZone));
}

/**
 * Product Hunt days run midnight-to-midnight Pacific time. Returns the UTC window
 * for the Pacific day `daysAgo` days before today (1 = yesterday, final vote counts).
 */
export function getProductHuntDayWindow(daysAgo = 1, now = new Date()) {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRODUCT_HUNT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = todayParts.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day - daysAgo));
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth() + 1;
  const td = target.getUTCDate();
  const start = startOfDayInZone(ty, tm, td, PRODUCT_HUNT_TIME_ZONE);
  const next = new Date(Date.UTC(ty, tm - 1, td + 1));
  const end = startOfDayInZone(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), PRODUCT_HUNT_TIME_ZONE);
  const label = `${ty}-${String(tm).padStart(2, "0")}-${String(td).padStart(2, "0")}`;
  return { start, end, label };
}

export async function fetchProductHuntPosts(window: { start: Date; end: Date }): Promise<ProductHuntPost[]> {
  const token = getProductHuntToken();
  if (!token) {
    throw new Error("PRODUCT_HUNT_TOKEN is not configured.");
  }

  const posts: ProductHuntPost[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await fetch(PRODUCT_HUNT_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: POSTS_QUERY,
        variables: {
          postedAfter: window.start.toISOString(),
          postedBefore: window.end.toISOString(),
          after,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Product Hunt API returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }

    const json = (await response.json()) as PostsResponse;
    if (json.errors?.length) {
      throw new Error(`Product Hunt API error: ${json.errors.map((error) => error.message).join("; ")}`);
    }

    const connection = json.data?.posts;
    if (!connection) {
      break;
    }

    for (const { node } of connection.edges) {
      posts.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        tagline: node.tagline,
        description: node.description,
        url: node.url,
        website: node.website,
        votesCount: node.votesCount,
        commentsCount: node.commentsCount,
        createdAt: node.createdAt,
        featuredAt: node.featuredAt,
        thumbnailUrl: node.thumbnail?.url ?? null,
        topics: node.topics.edges.map((edge) => edge.node.name),
      });
    }

    // Results are ordered by votes, so once a page drops below the threshold
    // and we already have the top N, later pages cannot add selections.
    const { topN, voteThreshold } = getLaunchSelectionConfig();
    const lowest = connection.edges.at(-1)?.node.votesCount ?? 0;
    if (!connection.pageInfo.hasNextPage || (posts.length >= topN && lowest < voteThreshold)) {
      break;
    }
    after = connection.pageInfo.endCursor;
  }

  return posts;
}

/**
 * Applies the selection rules: the day's top N by votes, the top featured
 * launches (rank 1 is treated as Product of the Day), and anything above the
 * vote threshold. Rank is approximated from vote order among featured posts.
 */
export function selectLaunches(posts: ProductHuntPost[]): SelectedLaunch[] {
  const { topN, topFeaturedRank, voteThreshold } = getLaunchSelectionConfig();
  const byVotes = [...posts].sort((a, b) => b.votesCount - a.votesCount);
  const featuredRanks = new Map<string, number>();
  byVotes
    .filter((post) => post.featuredAt)
    .forEach((post, index) => featuredRanks.set(post.id, index + 1));

  const selected: SelectedLaunch[] = [];
  byVotes.forEach((post, index) => {
    const reasons: string[] = [];
    const rank = featuredRanks.get(post.id) ?? null;
    if (index < topN) {
      reasons.push("top_votes");
    }
    if (rank === 1) {
      reasons.push("product_of_the_day");
    } else if (rank !== null && rank <= topFeaturedRank) {
      reasons.push("top_featured");
    }
    if (post.votesCount >= voteThreshold) {
      reasons.push("vote_threshold");
    }
    if (reasons.length > 0) {
      selected.push({ ...post, dailyRank: rank, selectionReasons: reasons });
    }
  });

  return selected;
}
