"use client";

import { useState } from "react";

type FounderOption = {
  slug: string;
  founderName: string;
  companyName: string;
};

type ClaimPanelProps = {
  founderOptions: FounderOption[];
};

export function ClaimPanel({ founderOptions }: ClaimPanelProps) {
  const [slug, setSlug] = useState(founderOptions[0]?.slug ?? "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/founders/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, message }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Unable to submit claim");
      return;
    }

    setStatus("Claim submitted. It will appear as pending until reviewed.");
    setMessage("");
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h2 className="text-base font-medium text-white">Claim Your Profile</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Select your founder profile and submit a verification message.
      </p>

      <form className="mt-4 space-y-3" onSubmit={submitClaim}>
        <select
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        >
          {founderOptions.map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {entry.founderName} - {entry.companyName}
            </option>
          ))}
        </select>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Add proof links, work email, or social profile..."
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />

        <button
          type="submit"
          disabled={saving || !slug}
          className="inline-flex rounded-md bg-[#6366f1] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
        >
          {saving ? "Submitting..." : "Submit Claim"}
        </button>

        {status ? <p className="text-xs text-zinc-300">{status}</p> : null}
      </form>
    </div>
  );
}
