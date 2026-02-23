import { z } from "zod";
import { INTERVIEW_QUESTIONS, REQUEST_STATUSES } from "@/lib/outreach/constants";

const optionalUrl = z
  .union([z.string().trim().url(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (!value || value === "") {
      return undefined;
    }
    return value;
  });

const optionalTrimmed = z
  .union([z.string().trim(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (!value || value === "") {
      return undefined;
    }
    return value;
  });

const optionalUuid = z
  .union([z.string().trim().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => {
    if (!value || value === "") {
      return undefined;
    }
    return value;
  });

const responseRecordSchema = z
  .record(z.string(), z.string().trim().min(2).max(6000))
  .refine(
    (value) =>
      INTERVIEW_QUESTIONS.every((item) =>
        Boolean(value[item.key] && value[item.key].trim().length >= 20),
      ),
    "All interview answers are required with meaningful detail.",
  );

export const interviewSubmissionSchema = z.object({
  featured_request_id: optionalUuid,
  founder_name: z.string().trim().min(2).max(160),
  work_email: z.string().trim().email().max(220),
  company_name: z.string().trim().min(2).max(220),
  responses: responseRecordSchema,
  asset_links: z.array(z.string().trim().url()).max(20).optional(),
  source: optionalTrimmed,
  external_submission_id: optionalTrimmed,
});

export const guestPostOrderSchema = z.object({
  name: z.string().trim().min(2).max(160),
  work_email: z.string().trim().email().max(220),
  company_name: z.string().trim().min(2).max(220),
  website_url: optionalUrl,
  target_url: optionalUrl,
  topic: z.string().trim().min(3).max(220),
  brief: z.string().trim().min(80).max(12000),
  budget_inr: z.number().int().positive().max(5000000).optional(),
  package_key: optionalTrimmed,
  source: optionalTrimmed,
  external_submission_id: optionalTrimmed,
});

export const instagramSyncItemSchema = z.object({
  external_post_id: z.string().trim().min(2).max(190),
  caption: z.string().trim().max(3000).optional(),
  media_url: z.string().trim().url(),
  permalink: z.string().trim().url(),
  thumbnail_url: z.string().trim().url().optional(),
  posted_at: z.string().datetime(),
});

export const instagramSyncSchema = z.object({
  items: z.array(instagramSyncItemSchema).min(1).max(50),
});

export const requestStatusSchema = z.enum(REQUEST_STATUSES);

export const reviewPatchSchema = z.object({
  status: requestStatusSchema.optional(),
  action: z
    .enum(["move_to_in_review", "approve", "reject", "publish"])
    .optional(),
  reviewNotes: z
    .union([z.string().trim().max(2000), z.literal(""), z.null()])
    .optional(),
});

export function mapActionToStatus(action: "move_to_in_review" | "approve" | "reject" | "publish") {
  if (action === "move_to_in_review") return "in_review" as const;
  if (action === "approve") return "approved" as const;
  if (action === "reject") return "rejected" as const;
  return "published" as const;
}

export function canTransitionStatus(
  current: "new" | "in_review" | "approved" | "rejected" | "published",
  target: "new" | "in_review" | "approved" | "rejected" | "published",
): boolean {
  if (current === target) {
    return true;
  }

  const allowed: Record<
    "new" | "in_review" | "approved" | "rejected" | "published",
    Array<"new" | "in_review" | "approved" | "rejected" | "published">
  > = {
    new: ["in_review", "approved", "rejected"],
    in_review: ["approved", "rejected"],
    approved: ["published", "rejected", "in_review"],
    rejected: ["in_review"],
    published: ["in_review"],
  };

  return allowed[current].includes(target);
}
