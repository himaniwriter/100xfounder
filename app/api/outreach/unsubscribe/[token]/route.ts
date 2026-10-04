import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db-config";
import { suppressContact } from "@/lib/launch/outreach";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

type RouteContext = { params: { token: string } };

// Handles both RFC 8058 one-click unsubscribe (from mail clients) and the
// confirmation form on /outreach/unsubscribe/[token].
export async function POST(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "Unavailable" }, { status: 503 });
  }

  const contact = await suppressContact(params.token, "unsubscribed");
  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");

  if (wantsHtml) {
    const url = new URL(`/outreach/unsubscribe/${params.token}`, getSiteBaseUrl());
    url.searchParams.set("done", contact ? "1" : "0");
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json({ success: Boolean(contact) }, { status: contact ? 200 : 404 });
}
