import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildUniqueBlogSlug,
  createAdminBlogPost,
} from "@/lib/admin/blog-content-store";
import {
  buildExcerpt,
  countWords,
  slugify,
} from "@/lib/blog/post-utils";
import {
  getConfiguredN8nSecret,
  isAuthorizedN8nWebhook,
} from "@/lib/security/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const seoMetadataSchema = z
  .object({
    title: z.string().min(4).optional(),
    description: z.string().min(10).optional(),
  })
  .optional();

const webhookPayloadSchema = z.object({
  title: z.string().min(4),
  content: z.string().min(100),
  feature_image: z.string().url().optional(),
  featureImage: z.string().url().optional(),
  image_credit: z.string().max(240).optional(),
  imageCredit: z.string().max(240).optional(),
  seo_metadata: seoMetadataSchema,
  seoMetadata: seoMetadataSchema,
});

export async function POST(request: Request) {
  const configuredSecret = await getConfiguredN8nSecret();
  if (!configuredSecret) {
    return NextResponse.json(
      { success: false, error: "N8N webhook secret is not configured." },
      { status: 500 },
    );
  }

  const authorized = await isAuthorizedN8nWebhook(request.headers);
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = webhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const featureImage =
    parsed.data.feature_image?.trim() || parsed.data.featureImage?.trim() || "";
  if (!featureImage) {
    return NextResponse.json(
      { success: false, error: "feature_image is required." },
      { status: 400 },
    );
  }

  const content = parsed.data.content.trim();
  const wordCount = countWords(content);
  if (wordCount < 800 || wordCount > 1400) {
    return NextResponse.json(
      {
        success: false,
        error: "Content must be between 800 and 1400 words.",
        wordCount,
      },
      { status: 400 },
    );
  }

  const slug = await buildUniqueBlogSlug(slugify(parsed.data.title));
  const seoTitle =
    parsed.data.seo_metadata?.title ||
    parsed.data.seoMetadata?.title ||
    parsed.data.title;
  const seoDescription =
    parsed.data.seo_metadata?.description ||
    parsed.data.seoMetadata?.description ||
    buildExcerpt(content);
  const imageCredit =
    parsed.data.image_credit?.trim() ||
    parsed.data.imageCredit?.trim() ||
    undefined;

  try {
    const post = await createAdminBlogPost({
      slug,
      title: parsed.data.title,
      content,
      status: "DRAFT",
      thumbnail: featureImage,
      imageCredit,
      seoTitle,
      seoDescription,
      excerpt: seoDescription,
    });

    return NextResponse.json(
      {
        success: true,
        post: {
          slug: post.slug,
          title: post.title,
          status: post.status,
          wordCount: post.wordCount ?? wordCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save webhook blog post.",
      },
      { status: 500 },
    );
  }
}
