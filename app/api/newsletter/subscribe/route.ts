import { NextResponse } from "next/server";
import { z } from "zod";
import { postToN8N } from "@/lib/n8n";

const subscribeSchema = z.object({
  email: z.string().email(),
  topic: z.string().min(2).max(120).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid subscription payload." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.N8N_NEWSLETTER_WEBHOOK_URL;
  const secret = process.env.N8N_SYNC_SECRET;

  try {
    await postToN8N(
      webhookUrl,
      {
        email: parsed.data.email,
        topic: parsed.data.topic ?? "general",
      },
      { secret },
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Subscription failed.",
      },
      { status: 500 },
    );
  }
}
