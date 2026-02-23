import { NextRequest, NextResponse } from "next/server";
import { recordSiteEvent } from "@/lib/analytics/site-events";
import { buildWhatsAppDeepLink } from "@/lib/marketing/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFallbackUrl(request: NextRequest): URL {
  const fallback = new URL("/get-featured", request.url);
  const context = request.nextUrl.searchParams.get("context")?.trim();
  const source = request.nextUrl.searchParams.get("source")?.trim();

  if (context) {
    fallback.searchParams.set("context", context);
  }
  if (source) {
    fallback.searchParams.set("source", source);
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  const context = request.nextUrl.searchParams.get("context")?.trim() || "general";
  const plan = request.nextUrl.searchParams.get("plan")?.trim() || undefined;
  const source = request.nextUrl.searchParams.get("source")?.trim() || "site";

  const waLink = buildWhatsAppDeepLink({ context, plan, source });
  const destination = waLink ? new URL(waLink) : buildFallbackUrl(request);

  await recordSiteEvent({
    event_name: "whatsapp_redirect",
    path: "/api/redirect/whatsapp",
    referrer: request.headers.get("referer") || null,
    payload: {
      cta_label: "whatsapp_redirect",
      cta_target: waLink ?? "/get-featured",
      context,
      plan,
      source,
      fallback_used: !waLink,
    },
  });

  return NextResponse.redirect(destination, { status: 307 });
}
