"use client";

import { useState, type FormEvent } from "react";

type FeatureFormProps = {
  token: string;
  productName: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-400/60 focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
      {children}
    </label>
  );
}

export function FeatureForm({ token, productName }: FeatureFormProps) {
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError(null);
    try {
      const response = await fetch(`/api/feature/${token}`, {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const json = (await response.json()) as { success: boolean; error?: string };
      if (!json.success) {
        setError(json.error || "Something went wrong. Please try again.");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.06] p-6">
        <h2 className="text-lg font-semibold text-white">Thank you! 🎉</h2>
        <p className="mt-2 text-sm text-zinc-300">
          We'll review your story and email you when your spotlight is live.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" encType="multipart/form-data">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name *">
          <input name="founderName" required minLength={2} maxLength={120} className={inputClass} />
        </Field>
        <Field label="Your role">
          <input name="role" maxLength={80} placeholder="Founder & CEO" className={inputClass} />
        </Field>
      </div>
      <Field label="Where are you based?">
        <input name="location" maxLength={120} placeholder="City, Country" className={inputClass} />
      </Field>
      <Field label={`Why did you start ${productName}? *`} hint="The moment or problem that made you build it.">
        <textarea name="storyOrigin" required minLength={40} maxLength={2000} rows={4} className={inputClass} />
      </Field>
      <Field label="What problem does it solve, and for whom? *">
        <textarea name="storyProblem" required minLength={40} maxLength={2000} rows={4} className={inputClass} />
      </Field>
      <Field label="Traction or milestones so far" hint="Users, revenue, launch results, anything you're proud of.">
        <textarea name="storyTraction" maxLength={1500} rows={3} className={inputClass} />
      </Field>
      <Field label="One piece of advice for other founders">
        <textarea name="storyAdvice" maxLength={1500} rows={3} className={inputClass} />
      </Field>
      <Field label="What's next?">
        <textarea name="storyNext" maxLength={1500} rows={3} className={inputClass} />
      </Field>
      <Field label="Your photo" hint="JPG, PNG or WebP under 5 MB. Used on your spotlight and Instagram post.">
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block text-sm text-zinc-300"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="X / Twitter URL">
          <input name="twitterUrl" type="url" placeholder="https://x.com/…" className={inputClass} />
        </Field>
        <Field label="LinkedIn URL">
          <input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/…" className={inputClass} />
        </Field>
        <Field label="Instagram handle">
          <input name="instagramHandle" placeholder="@yourhandle" className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-300">
        <label className="flex gap-3">
          <input type="checkbox" name="consentWebsite" required className="mt-1" />
          <span>I agree that 100xFounder can publish this spotlight, including my name and photo, on 100xfounder.com. *</span>
        </label>
        <label className="flex gap-3">
          <input type="checkbox" name="consentInstagram" defaultChecked className="mt-1" />
          <span>I'm happy for 100xFounder to share it on Instagram (@100x.founder) and tag me.</span>
        </label>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full rounded-lg border border-indigo-400/40 bg-indigo-500/20 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500/30 disabled:opacity-60"
      >
        {state === "submitting" ? "Submitting…" : "Submit my spotlight"}
      </button>
    </form>
  );
}
