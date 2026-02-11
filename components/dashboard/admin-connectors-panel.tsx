"use client";

import { useState } from "react";

type Connector = {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  authHeader: string | null;
  isActive: boolean;
  lastSyncAt: string | Date | null;
};

type AdminConnectorsPanelProps = {
  initialConnectors: Connector[];
};

export function AdminConnectorsPanel({
  initialConnectors,
}: AdminConnectorsPanelProps) {
  const [connectors, setConnectors] = useState(initialConnectors);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [authHeader, setAuthHeader] = useState("Authorization");
  const [authValue, setAuthValue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refreshConnectors() {
    const response = await fetch("/api/dashboard/connectors");
    const result = await response.json();

    if (response.ok && result.success) {
      setConnectors(result.connectors);
    }
  }

  async function addConnector(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const response = await fetch("/api/dashboard/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        provider,
        endpoint,
        authHeader: authHeader || undefined,
        authValue: authValue || undefined,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to save connector");
      return;
    }

    setStatus("Connector saved.");
    setName("");
    setProvider("");
    setEndpoint("");
    setAuthValue("");
    await refreshConnectors();
  }

  async function syncConnector(id: string) {
    setStatus("Syncing connector...");

    const response = await fetch(`/api/dashboard/connectors/${id}/sync`, {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Sync failed");
      return;
    }

    setStatus(`Sync complete. Upserted ${result.upserted} founder records.`);
    await refreshConnectors();
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <h2 className="text-base font-medium text-white">Aggregator Connectors</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Connect external APIs and sync founder/company records into the directory.
      </p>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={addConnector}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Connector Name"
          required
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
        <input
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder="Provider (e.g. Crunchbase API)"
          required
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
        <input
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          placeholder="https://api.provider.com/founders"
          required
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
        />
        <input
          value={authHeader}
          onChange={(event) => setAuthHeader(event.target.value)}
          placeholder="Auth Header"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
        <input
          value={authValue}
          onChange={(event) => setAuthValue(event.target.value)}
          placeholder="Auth Value"
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-fit rounded-md bg-[#6366f1] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
        >
          {saving ? "Saving..." : "Add Connector"}
        </button>
      </form>

      {status ? <p className="mt-3 text-xs text-zinc-300">{status}</p> : null}

      <div className="mt-6 space-y-3">
        {connectors.map((connector) => (
          <div
            key={connector.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
          >
            <div>
              <p className="text-sm text-white">{connector.name}</p>
              <p className="text-xs text-zinc-400">{connector.provider}</p>
              <p className="mt-1 text-xs text-zinc-500">{connector.endpoint}</p>
            </div>
            <button
              type="button"
              onClick={() => syncConnector(connector.id)}
              className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
            >
              Sync Now
            </button>
          </div>
        ))}

        {connectors.length === 0 ? (
          <p className="text-xs text-zinc-500">No connectors configured yet.</p>
        ) : null}
      </div>
    </div>
  );
}
