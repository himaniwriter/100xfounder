"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Eye, EyeOff } from "lucide-react";

type IntegrationSettings = {
  n8nPrimaryWebhookUrl: string;
  n8nBaseWebhookUrl: string;
  n8nNewsScraperWebhookUrl: string;
  n8nNewsletterWebhookUrl: string;
  n8nEnrichDataWebhookUrl: string;
  n8nClaimProfileWebhookUrl: string;
  n8nSecretKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseDatabaseUrl: string;
  supabaseProjectRef: string;
  supabaseStorageBucket: string;
  supabaseSchema: string;
};

type IntegrationSettingsResponse = IntegrationSettings & {
  hasN8nSecretKey?: boolean;
  hasSupabaseAnonKey?: boolean;
  hasSupabaseServiceRoleKey?: boolean;
  hasSupabaseDatabaseUrl?: boolean;
};

const DEFAULT_SETTINGS: IntegrationSettings = {
  n8nPrimaryWebhookUrl: "",
  n8nBaseWebhookUrl: "",
  n8nNewsScraperWebhookUrl: "",
  n8nNewsletterWebhookUrl: "",
  n8nEnrichDataWebhookUrl: "",
  n8nClaimProfileWebhookUrl: "",
  n8nSecretKey: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  supabaseDatabaseUrl: "",
  supabaseProjectRef: "",
  supabaseStorageBucket: "images",
  supabaseSchema: "public",
};

const fetcher = async (url: string): Promise<IntegrationSettingsResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load integration settings");
  }

  const settings = (result.settings ?? {}) as Partial<IntegrationSettingsResponse>;
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
  };
};

type InputFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: "text" | "password";
  disabled?: boolean;
};

function InputField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  disabled = false,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-400/40 disabled:opacity-70"
      />
    </div>
  );
}

export function IntegrationSettingsPanel() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/settings", fetcher);
  const [form, setForm] = useState<IntegrationSettings>(DEFAULT_SETTINGS);
  const [secretState, setSecretState] = useState({
    hasN8nSecretKey: false,
    hasSupabaseAnonKey: false,
    hasSupabaseServiceRoleKey: false,
    hasSupabaseDatabaseUrl: false,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        n8nPrimaryWebhookUrl: data.n8nPrimaryWebhookUrl,
        n8nBaseWebhookUrl: data.n8nBaseWebhookUrl,
        n8nNewsScraperWebhookUrl: data.n8nNewsScraperWebhookUrl,
        n8nNewsletterWebhookUrl: data.n8nNewsletterWebhookUrl,
        n8nEnrichDataWebhookUrl: data.n8nEnrichDataWebhookUrl,
        n8nClaimProfileWebhookUrl: data.n8nClaimProfileWebhookUrl,
        n8nSecretKey: "",
        supabaseUrl: data.supabaseUrl,
        supabaseAnonKey: "",
        supabaseServiceRoleKey: "",
        supabaseDatabaseUrl: "",
        supabaseProjectRef: data.supabaseProjectRef,
        supabaseStorageBucket: data.supabaseStorageBucket,
        supabaseSchema: data.supabaseSchema,
      });
      setSecretState({
        hasN8nSecretKey: Boolean(data.hasN8nSecretKey),
        hasSupabaseAnonKey: Boolean(data.hasSupabaseAnonKey),
        hasSupabaseServiceRoleKey: Boolean(data.hasSupabaseServiceRoleKey),
        hasSupabaseDatabaseUrl: Boolean(data.hasSupabaseDatabaseUrl),
      });
    }
  }, [data]);

  const isSupabaseConfigured = useMemo(() => {
    return Boolean(
      form.supabaseUrl.trim() &&
      (form.supabaseAnonKey.trim() || secretState.hasSupabaseAnonKey) &&
      (form.supabaseServiceRoleKey.trim() || secretState.hasSupabaseServiceRoleKey),
    );
  }, [form, secretState.hasSupabaseAnonKey, secretState.hasSupabaseServiceRoleKey]);

  const isN8nConfigured = useMemo(() => {
    return Boolean(
      form.n8nPrimaryWebhookUrl.trim() ||
      form.n8nBaseWebhookUrl.trim() ||
      form.n8nNewsScraperWebhookUrl.trim() ||
      form.n8nNewsletterWebhookUrl.trim() ||
      form.n8nEnrichDataWebhookUrl.trim() ||
      form.n8nClaimProfileWebhookUrl.trim(),
    );
  }, [form]);

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setStatus({
          type: "error",
          message: `Failed to save settings: ${result.error ?? "Unknown error."}`,
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Settings saved successfully.",
      });
      await mutate();
    } catch (saveError) {
      setStatus({
        type: "error",
        message:
          saveError instanceof Error
            ? `Failed to save settings: ${saveError.message}`
            : "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure automation and database credentials used by the admin workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">N8N Status</h2>
          <p className="mt-2 text-sm text-zinc-300">
            {isN8nConfigured
              ? "Webhook endpoints are configured from dashboard settings."
              : "No webhook URL configured yet. Add at least one URL below."}
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Supabase Status
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            {isSupabaseConfigured
              ? "Supabase credentials are present for API/storage integration."
              : "Missing required Supabase credentials (URL + Anon + Service Role)."}
          </p>
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="space-y-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md"
      >
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading integration settings...</p>
        ) : error ? (
          <p className="text-sm text-red-300">{(error as Error).message}</p>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
                N8N Webhooks
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <InputField
                  label="Primary N8N Webhook URL"
                  value={form.n8nPrimaryWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/100xfounder-main"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nPrimaryWebhookUrl: value }))
                  }
                />
                <InputField
                  label="Base Webhook URL"
                  value={form.n8nBaseWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/100xfounder"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nBaseWebhookUrl: value }))
                  }
                />
                <InputField
                  label="Secret Key Header"
                  type={showSecrets ? "text" : "password"}
                  value={form.n8nSecretKey}
                  placeholder={secretState.hasN8nSecretKey ? "Configured (leave blank to keep current)" : "x-secret-key value"}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nSecretKey: value }))
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <InputField
                  label="News Scraper Webhook"
                  value={form.n8nNewsScraperWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/news-scraper"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nNewsScraperWebhookUrl: value }))
                  }
                />
                <InputField
                  label="Newsletter Sync Webhook"
                  value={form.n8nNewsletterWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/newsletter-sync"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nNewsletterWebhookUrl: value }))
                  }
                />
                <InputField
                  label="Enrich Data Webhook"
                  value={form.n8nEnrichDataWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/enrich-data"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nEnrichDataWebhookUrl: value }))
                  }
                />
                <InputField
                  label="Claim Profile Webhook"
                  value={form.n8nClaimProfileWebhookUrl}
                  placeholder="https://n8n.yourdomain.com/webhook/claim-profile"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, n8nClaimProfileWebhookUrl: value }))
                  }
                />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
                Supabase Connection
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                <InputField
                  label="Supabase URL"
                  value={form.supabaseUrl}
                  placeholder="https://xyzcompany.supabase.co"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseUrl: value }))
                  }
                />
                <InputField
                  label="Project Reference"
                  value={form.supabaseProjectRef}
                  placeholder="xyzcompany"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseProjectRef: value }))
                  }
                />
                <InputField
                  label="Anon Public Key"
                  type={showSecrets ? "text" : "password"}
                  value={form.supabaseAnonKey}
                  placeholder={secretState.hasSupabaseAnonKey ? "Configured (leave blank to keep current)" : "eyJhbGciOiJIUzI1NiIsInR..."}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseAnonKey: value }))
                  }
                />
                <InputField
                  label="Service Role Key"
                  type={showSecrets ? "text" : "password"}
                  value={form.supabaseServiceRoleKey}
                  placeholder={secretState.hasSupabaseServiceRoleKey ? "Configured (leave blank to keep current)" : "eyJhbGciOiJIUzI1NiIsInR..."}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseServiceRoleKey: value }))
                  }
                />
                <InputField
                  label="Database URL"
                  type={showSecrets ? "text" : "password"}
                  value={form.supabaseDatabaseUrl}
                  placeholder={secretState.hasSupabaseDatabaseUrl ? "Configured (leave blank to keep current)" : "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseDatabaseUrl: value }))
                  }
                />
                <InputField
                  label="Schema"
                  value={form.supabaseSchema}
                  placeholder="public"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseSchema: value }))
                  }
                />
                <InputField
                  label="Storage Bucket"
                  value={form.supabaseStorageBucket}
                  placeholder="images"
                  onChange={(value) =>
                    setForm((current) => ({ ...current, supabaseStorageBucket: value }))
                  }
                />
              </div>
            </section>
          </>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSecrets((current) => !current)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-3 text-sm text-zinc-200 transition-colors hover:border-white/30"
          >
            {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSecrets ? "Hide Secrets" : "Show Secrets"}
          </button>

          <button
            type="submit"
            disabled={saving || isLoading}
            className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Integration Settings"}
          </button>
        </div>
      </form>

      {status ? (
        <p
          className={
            status.type === "success"
              ? "rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
              : "rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          }
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
