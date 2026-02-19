import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

const eventSchema = z.object({
  event_name: z.enum([
    "cta_click",
    "featured_form_submit",
    "pricing_waitlist_submit",
    "search_submit",
  ]),
  path: z.string().trim().min(1).max(240),
  referrer: z.union([z.string().trim().max(1000), z.null()]).optional(),
  session_id: z.union([z.string().trim().max(120), z.null()]).optional(),
  payload: z.unknown().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid event payload." },
      { status: 400 },
    );
  }

  const payloadSize = JSON.stringify(parsed.data.payload ?? {}).length;
  if (payloadSize > 8000) {
    return NextResponse.json(
      { success: false, error: "Event payload too large." },
      { status: 400 },
    );
  }

  try {
    await prisma.siteEvent.create({
      data: {
        eventName: parsed.data.event_name,
        path: parsed.data.path,
        referrer: parsed.data.referrer ?? null,
        sessionId: parsed.data.session_id ?? null,
        payload: parsed.data.payload as never,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Event tracking failed:", error);

    return NextResponse.json(
      { success: true, stored: false, warning: toPublicDatabaseError(error, "Failed to track event.") },
      { status: 201 },
    );
  }
}
