import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-config";

export type SiteEventName =
  | "cta_click"
  | "featured_form_submit"
  | "pricing_waitlist_submit"
  | "search_submit"
  | "interview_questionnaire_submit"
  | "guest_post_order_submit"
  | "whatsapp_redirect"
  | "page_not_found";

export type SiteEventPayload = {
  event_name: SiteEventName;
  path: string;
  referrer?: string | null;
  session_id?: string | null;
  payload?: Prisma.JsonValue;
};

export async function recordSiteEvent(input: SiteEventPayload): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  try {
    await prisma.siteEvent.create({
      data: {
        eventName: input.event_name,
        path: input.path,
        referrer: input.referrer ?? null,
        sessionId: input.session_id ?? null,
        payload: input.payload ?? undefined,
      },
    });
  } catch {
    // Event tracking must not break user-facing flows.
  }
}
