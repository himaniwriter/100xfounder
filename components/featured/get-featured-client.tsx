"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FEATURED_FAQS,
  FEATURED_PLANS,
  formatInr,
  formatUsd,
  type FeaturedPlanKey,
} from "@/lib/featured/config";
import { trackSiteEvent } from "@/lib/client-tracking";

type GetFeaturedClientProps = {
  n8nFormUrl: string;
};

export function GetFeaturedClient({ n8nFormUrl }: GetFeaturedClientProps) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    founder_name: "",
    work_email: "",
    company_name: "",
    website_url: "",
    linkedin_url: "",
    country: "",
    industry: "",
    stage: "",
    product_summary: "",
    funding_info: "",
    plan: "starter" as FeaturedPlanKey,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const utmSource = searchParams.get("utm_source");
    const utmMedium = searchParams.get("utm_medium");
    const utmCampaign = searchParams.get("utm_campaign");

    const response = await fetch("/api/featured/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to submit application.");
      return;
    }

    setSuccess(
      "Application received. Our team will review your details and contact you with next steps.",
    );
    trackSiteEvent({
      event_name: "featured_form_submit",
      path: "/get-featured",
      payload: {
        plan: form.plan,
        source: "site_form",
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      },
    });
    setForm({
      founder_name: "",
      work_email: "",
      company_name: "",
      website_url: "",
      linkedin_url: "",
      country: "",
      industry: "",
      stage: "",
      product_summary: "",
      funding_info: "",
      plan: "starter",
    });
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Founder Visibility</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Get Featured on 100Xfounder
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
          Showcase your founder profile in front of operators, investors, and ecosystem partners.
          Choose a one-time plan, submit your details, and our team will review before publish.
        </p>
        <div className="mt-6">
          <a
            href="#apply"
            onClick={() =>
              trackSiteEvent({
                event_name: "cta_click",
                path: "/get-featured",
                payload: {
                  cta_label: "Start Application",
                  cta_target: "#apply",
                  section: "get_featured_hero",
                },
              })
            }
            className="inline-flex items-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/25"
          >
            Start Application
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURED_PLANS.map((plan) => (
          <div
            key={plan.key}
            className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md"
          >
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
              {plan.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatInr(plan.priceInr)}
              <span className="ml-2 text-sm font-normal text-zinc-400">
                / {formatUsd(plan.priceUsd)}
              </span>
            </p>
            <p className="mt-3 text-sm text-zinc-300">{plan.description}</p>

            <h2 className="mt-4 text-xs uppercase tracking-wide text-zinc-500">What you get</h2>
            <ul className="mt-2 space-y-2 text-sm text-zinc-300">
              {plan.deliverables.map((item) => (
                <li key={item} className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section
        id="apply"
        className="grid gap-6 rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md lg:grid-cols-2"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Apply with n8n Form</h2>
          <p className="mt-2 text-sm text-zinc-400">
            If your embedded n8n form is configured, applicants can submit directly below.
          </p>

          {n8nFormUrl ? (
            <iframe
              src={n8nFormUrl}
              title="Get Featured n8n Form"
              className="mt-4 h-[720px] w-full rounded-xl border border-white/15 bg-black/40"
            />
          ) : (
            <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 p-4 text-sm text-amber-200">
              Set <code>NEXT_PUBLIC_N8N_FEATURED_FORM_URL</code> to render your embedded n8n form.
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Fallback Application Form</h2>
          <p className="mt-2 text-sm text-zinc-400">
            This form submits to our secure API and can also forward to n8n automation.
          </p>

          <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              required
              value={form.founder_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, founder_name: event.target.value }))
              }
              placeholder="Founder Name"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              required
              type="email"
              value={form.work_email}
              onChange={(event) =>
                setForm((current) => ({ ...current, work_email: event.target.value }))
              }
              placeholder="Work Email"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              required
              value={form.company_name}
              onChange={(event) =>
                setForm((current) => ({ ...current, company_name: event.target.value }))
              }
              placeholder="Company Name"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <select
              value={form.plan}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  plan: event.target.value as FeaturedPlanKey,
                }))
              }
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            >
              {FEATURED_PLANS.map((plan) => (
                <option key={plan.key} value={plan.key}>
                  {plan.label}
                </option>
              ))}
            </select>
            <input
              value={form.website_url}
              onChange={(event) =>
                setForm((current) => ({ ...current, website_url: event.target.value }))
              }
              placeholder="Website URL (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.linkedin_url}
              onChange={(event) =>
                setForm((current) => ({ ...current, linkedin_url: event.target.value }))
              }
              placeholder="LinkedIn URL (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.country}
              onChange={(event) =>
                setForm((current) => ({ ...current, country: event.target.value }))
              }
              placeholder="Country (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.industry}
              onChange={(event) =>
                setForm((current) => ({ ...current, industry: event.target.value }))
              }
              placeholder="Industry (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <input
              value={form.stage}
              onChange={(event) =>
                setForm((current) => ({ ...current, stage: event.target.value }))
              }
              placeholder="Stage (optional)"
              className="h-10 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
            <textarea
              required
              rows={4}
              value={form.product_summary}
              onChange={(event) =>
                setForm((current) => ({ ...current, product_summary: event.target.value }))
              }
              placeholder="Product Summary"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
            />
            <textarea
              rows={3}
              value={form.funding_info}
              onChange={(event) =>
                setForm((current) => ({ ...current, funding_info: event.target.value }))
              }
              placeholder="Funding Info (optional)"
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
            />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70 md:col-span-2"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
          {success ? <p className="mt-3 text-xs text-emerald-300">{success}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white">FAQs</h2>
        <div className="mt-4 space-y-3">
          {FEATURED_FAQS.map((faq) => (
            <div key={faq.question} className="rounded-md border border-white/10 bg-black/30 p-3">
              <p className="text-sm font-medium text-white">{faq.question}</p>
              <p className="mt-1 text-sm text-zinc-300">{faq.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Refunds and service terms are governed by our{" "}
          <Link href="/fulfillment-policy" className="text-indigo-300 hover:text-indigo-200">
            Fulfillment Policy
          </Link>
          .
        </p>
      </section>
    </section>
  );
}
