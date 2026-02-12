import { redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromCookies, getSessionFromRequest } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/types";

export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await getSessionFromCookies();

  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}

export async function requireAdminApi(
  request: NextRequest,
): Promise<{ session: SessionPayload } | NextResponse> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  return { session };
}
