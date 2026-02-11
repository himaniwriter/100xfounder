"use server";

type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string };

export async function updateFounderProfile(
  formData: FormData,
): Promise<UpdateProfileResult> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const secretKey = process.env.N8N_SECRET_KEY;

  if (!webhookUrl) {
    return { success: false, error: "Missing N8N_WEBHOOK_URL" };
  }

  if (!secretKey) {
    return { success: false, error: "Missing N8N_SECRET_KEY" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();

  if (!name) {
    return { success: false, error: "Name is required." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        name,
        bio,
        linkedinUrl,
        submittedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return {
        success: false,
        error: details
          ? `n8n webhook failed (${response.status}): ${details}`
          : `n8n webhook failed with status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}
