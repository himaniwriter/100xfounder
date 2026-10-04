import { z } from "zod";
import { slugify } from "@/lib/blog/post-utils";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import { queueSpotlightInstagramPost } from "@/lib/launch/instagram";
import { prisma } from "@/lib/prisma";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || /^https:\/\/\S+$/i.test(value), "Must be an https:// link");

export const spotlightSubmissionSchema = z.object({
  founderName: z.string().trim().min(2).max(120),
  role: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  storyOrigin: z.string().trim().min(40, "Tell us a bit more (40+ characters)").max(2000),
  storyProblem: z.string().trim().min(40, "Tell us a bit more (40+ characters)").max(2000),
  storyTraction: z.string().trim().max(1500).optional(),
  storyAdvice: z.string().trim().max(1500).optional(),
  storyNext: z.string().trim().max(1500).optional(),
  twitterUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  instagramHandle: z
    .string()
    .trim()
    .max(31)
    .optional()
    .transform((value) => value?.replace(/^@/, "") || undefined)
    .refine((value) => !value || /^[A-Za-z0-9._]+$/.test(value), "Invalid Instagram handle"),
  consentWebsite: z.literal(true, { message: "Consent is required to publish your spotlight" }),
  consentInstagram: z.boolean(),
});

export type SpotlightSubmission = z.infer<typeof spotlightSubmissionSchema>;

export async function getFeatureInvite(token: string) {
  await ensureLaunchOutreachSchema();
  return prisma.outreachContact.findUnique({
    where: { token },
    include: { product: true, spotlight: { select: { id: true, status: true, slug: true } } },
  });
}

async function uniqueSpotlightSlug(founderName: string, productName: string): Promise<string> {
  const base = slugify(`${founderName} ${productName}`) || slugify(productName);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await prisma.founderSpotlight.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) {
      return candidate;
    }
  }
  return `${base}-${Date.now()}`;
}

export function isSpotlightAutoPublishEnabled(): boolean {
  return ["1", "true", "yes"].includes((process.env.SPOTLIGHT_AUTO_PUBLISH || "").trim().toLowerCase());
}

export async function createSpotlightFromInvite(
  contactId: string,
  data: SpotlightSubmission,
  photoUrl: string | null,
) {
  const contact = await prisma.outreachContact.findUniqueOrThrow({
    where: { id: contactId },
    include: { product: true },
  });

  const spotlight = await prisma.founderSpotlight.create({
    data: {
      productId: contact.productId,
      contactId: contact.id,
      slug: await uniqueSpotlightSlug(data.founderName, contact.product.name),
      founderName: data.founderName,
      role: data.role || null,
      email: contact.email,
      photoUrl,
      location: data.location || null,
      storyOrigin: data.storyOrigin,
      storyProblem: data.storyProblem,
      storyTraction: data.storyTraction || null,
      storyAdvice: data.storyAdvice || null,
      storyNext: data.storyNext || null,
      twitterUrl: data.twitterUrl || null,
      linkedinUrl: data.linkedinUrl || null,
      instagramHandle: data.instagramHandle || null,
      consentWebsite: data.consentWebsite,
      consentInstagram: data.consentInstagram,
      status: "submitted",
    },
  });

  await prisma.outreachContact.update({
    where: { id: contact.id },
    data: { status: "form_submitted", name: data.founderName, nextSendAt: null },
  });

  if (isSpotlightAutoPublishEnabled()) {
    await publishSpotlight(spotlight.id);
  }

  return spotlight;
}

/** Publishes a spotlight on the site and queues its Instagram carousel if consented. */
export async function publishSpotlight(spotlightId: string) {
  const spotlight = await prisma.founderSpotlight.update({
    where: { id: spotlightId },
    data: { status: "published", publishedAt: new Date() },
    include: { product: true },
  });

  if (spotlight.contactId) {
    await prisma.outreachContact.update({
      where: { id: spotlight.contactId },
      data: { status: "featured" },
    });
  }

  if (spotlight.consentInstagram) {
    await queueSpotlightInstagramPost(spotlight);
  }

  return spotlight;
}
