import { randomBytes } from "node:crypto";
import { slugify } from "@/lib/blog/post-utils";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import { discoverContact, resolveWebsiteUrl } from "@/lib/launch/contacts";
import {
  fetchProductHuntPosts,
  getProductHuntDayWindow,
  selectLaunches,
  type SelectedLaunch,
} from "@/lib/launch/producthunt";
import { prisma } from "@/lib/prisma";

export function createContactToken(): string {
  return randomBytes(24).toString("base64url");
}

async function uniqueProductSlug(launch: SelectedLaunch): Promise<string> {
  const base = slugify(launch.name) || slugify(launch.slug) || launch.id;
  const existing = await prisma.launchProduct.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? `${base}-${slugify(launch.slug) || launch.id}` : base;
}

export type ImportResult = {
  day: string;
  fetched: number;
  selected: number;
  created: number;
  updated: number;
};

/** Imports the selected Product Hunt launches for one Pacific-time day. */
export async function importProductHuntDay(daysAgo = 1): Promise<ImportResult> {
  await ensureLaunchOutreachSchema();
  const window = getProductHuntDayWindow(daysAgo);
  const posts = await fetchProductHuntPosts(window);
  const selected = selectLaunches(posts);
  let created = 0;
  let updated = 0;

  for (const launch of selected) {
    const existing = await prisma.launchProduct.findUnique({
      where: { source_externalId: { source: "producthunt", externalId: launch.id } },
      select: { id: true },
    });

    const shared = {
      name: launch.name,
      tagline: launch.tagline,
      description: launch.description,
      sourceUrl: launch.url,
      thumbnailUrl: launch.thumbnailUrl,
      votesCount: launch.votesCount,
      commentsCount: launch.commentsCount,
      topics: launch.topics,
      featuredAt: launch.featuredAt ? new Date(launch.featuredAt) : null,
      dailyRank: launch.dailyRank,
      selectionReasons: launch.selectionReasons,
    };

    if (existing) {
      await prisma.launchProduct.update({ where: { id: existing.id }, data: shared });
      updated += 1;
      continue;
    }

    await prisma.launchProduct.create({
      data: {
        ...shared,
        source: "producthunt",
        externalId: launch.id,
        slug: await uniqueProductSlug(launch),
        websiteUrl: await resolveWebsiteUrl(launch.website),
        launchedAt: new Date(launch.createdAt),
      },
    });
    created += 1;
  }

  return { day: window.label, fetched: posts.length, selected: selected.length, created, updated };
}

export type ContactDiscoveryResult = {
  checked: number;
  found: number;
};

/**
 * Finds a published contact email for recently imported products and queues it
 * for outreach. Each email address is only ever contacted once across products.
 */
export async function discoverContactsForNewProducts(limit = 15): Promise<ContactDiscoveryResult> {
  await ensureLaunchOutreachSchema();
  const products = await prisma.launchProduct.findMany({
    where: { contactsCheckedAt: null, websiteUrl: { not: null } },
    orderBy: { launchedAt: "desc" },
    take: limit,
  });

  let found = 0;
  for (const product of products) {
    const contact = await discoverContact(product.websiteUrl!);
    if (contact) {
      const [suppressed, alreadyContacted] = await Promise.all([
        prisma.outreachSuppression.findUnique({ where: { email: contact.email } }),
        prisma.outreachContact.findFirst({ where: { email: contact.email }, select: { id: true } }),
      ]);

      if (!suppressed && !alreadyContacted) {
        await prisma.outreachContact.create({
          data: {
            productId: product.id,
            email: contact.email,
            twitterUrl: contact.twitterUrl,
            linkedinUrl: contact.linkedinUrl,
            discoveredFrom: contact.discoveredFrom,
            status: "queued",
            nextSendAt: new Date(),
            token: createContactToken(),
          },
        });
        found += 1;
      }
    }

    await prisma.launchProduct.update({
      where: { id: product.id },
      data: { contactsCheckedAt: new Date() },
    });
  }

  return { checked: products.length, found };
}
