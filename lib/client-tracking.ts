"use client";

export async function logDataUnlock(companyId: string, companyViewed?: string) {
  try {
    await fetch("/api/events/unlock-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        companyViewed: companyViewed ?? companyId,
      }),
    });
  } catch {
    // Intentionally no-op for client analytics failures.
  }
}
