import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/session";
import { postToN8N } from "@/lib/n8n";

const unlockSchema = z.object({
  companyId: z.string().min(1),
  companyViewed: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = unlockSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid unlock payload." },
      { status: 400 },
    );
  }

  const session = await getSessionFromRequest(request);
  const webhookUrl = process.env.N8N_UNLOCK_CONTACT_WEBHOOK_URL;
  const secret = process.env.N8N_SYNC_SECRET;

  try {
    await postToN8N(
      webhookUrl,
      {
        userId: session?.userId ?? "anonymous",
        companyId: parsed.data.companyId,
        companyViewed: parsed.data.companyViewed,
      },
      { secret },
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unlock tracking failed.",
      },
      { status: 500 },
    );
  }
}
