type PostToN8NOptions = {
  secret?: string;
  timeoutMs?: number;
};

export async function postToN8N(
  webhookUrl: string | undefined,
  payload: unknown,
  options: PostToN8NOptions = {},
) {
  if (!webhookUrl) {
    return { success: false, skipped: true as const };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.secret) {
    headers["x-secret-key"] = options.secret;
  }

  const timeoutMs = Math.max(1000, options.timeoutMs ?? 8000);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`N8N webhook failed (${response.status}): ${text || "Unknown error"}`);
  }

  return { success: true, skipped: false as const };
}
