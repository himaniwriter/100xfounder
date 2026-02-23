import { NextResponse, type NextRequest } from "next/server";
import type { SessionPayload } from "@/lib/auth/types";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function requireDashboardSession(
  request: NextRequest,
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { session };
}
