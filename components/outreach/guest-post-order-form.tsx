"use client";

import { useState } from "react";
import { GUEST_POST_PACKAGES } from "@/lib/outreach/constants";

type GuestPostOrderFormState = {
  name: string;
  work_email: string;
  company_name: string;
  website_url: string;
  target_url: string;
  topic: string;
  brief: string;
  budget_inr: string;
  package_key: string;
};

type GuestPostOrderFormProps = {
  defaultPackageKey?: string;
};

export function GuestPostOrderForm({ defaultPackageKey }: GuestPostOrderFormProps) {
  const initialPackage =
    defaultPackageKey &&
    GUEST_POST_PACKAGES.some((pkg) => pkg.key === defaultPackageKey)
      ? defaultPackageKey
      : GUEST_POST_PACKAGES[0]?.key || "starter";

  const [form, setForm] = useState<GuestPostOrderFormState>({
    name: "",
    work_email: "",
    company_name: "",
    website_url: "",
    target_url: "",
    topic: "",
    brief: "",
    budget_inr: "",
    package_key: initialPackage,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/guest-post/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget_inr: form.budget_inr ? Number(form.budget_inr) : undefined,
        source: "site_form",
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to submit guest post order.");
      return;
    }

    setSuccess("Order received. Our editorial team will contact you with next steps.");
    setForm((current) => ({
      ...current,
      topic: "",
      brief: "",
      target_url: "",
      budget_inr: "",
    }));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input
        required
        value={form.name}
        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        placeholder="Full Name"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      />
      <input
        required
        type="email"
        value={form.work_email}
        onChange={(event) =>
          setForm((current) => ({ ...current, work_email: event.target.value }))
        }
        placeholder="Work Email"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      />
      <input
        required
        value={form.company_name}
        onChange={(event) =>
          setForm((current) => ({ ...current, company_name: event.target.value }))
        }
        placeholder="Company Name"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      />
      <select
        value={form.package_key}
        onChange={(event) =>
          setForm((current) => ({ ...current, package_key: event.target.value }))
        }
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      >
        {GUEST_POST_PACKAGES.map((pkg) => (
          <option key={pkg.key} value={pkg.key}>
            {pkg.label}
          </option>
        ))}
      </select>
      <input
        value={form.website_url}
        onChange={(event) =>
          setForm((current) => ({ ...current, website_url: event.target.value }))
        }
        placeholder="Website URL (optional)"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      />
      <input
        value={form.target_url}
        onChange={(event) =>
          setForm((current) => ({ ...current, target_url: event.target.value }))
        }
        placeholder="Target URL for backlink (optional)"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
      />
      <input
        required
        value={form.topic}
        onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
        placeholder="Article Topic"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
      />
      <textarea
        required
        rows={6}
        value={form.brief}
        onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))}
        placeholder="Content brief, intent, target audience, references, and publishing requirements"
        className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
      />
      <input
        value={form.budget_inr}
        onChange={(event) => setForm((current) => ({ ...current, budget_inr: event.target.value }))}
        placeholder="Budget INR (optional)"
        className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 md:col-span-2"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-md bg-indigo-500 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-70 md:col-span-2"
      >
        {loading ? "Submitting..." : "Submit Guest Post Order"}
      </button>

      {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300 md:col-span-2">{success}</p> : null}
    </form>
  );
}
