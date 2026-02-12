"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";

type FounderRow = {
  id: string;
  slug: string;
  founderName: string;
  companyName: string;
  industry: string;
  stage: string;
  productSummary: string;
  websiteUrl: string | null;
  fundingInfo: string | null;
  foundedYear: number | null;
  status: "VERIFIED" | "PENDING";
  tier: "FREE" | "PRO";
  email: string;
  verified: boolean;
  updatedAt: string;
};

type FounderFormState = {
  founderName: string;
  companyName: string;
  industry: string;
  stage: string;
  productSummary: string;
  websiteUrl: string;
  fundingInfo: string;
  foundedYear: string;
};

const EMPTY_FORM: FounderFormState = {
  founderName: "",
  companyName: "",
  industry: "",
  stage: "",
  productSummary: "",
  websiteUrl: "",
  fundingInfo: "",
  foundedYear: "",
};

const columnHelper = createColumnHelper<FounderRow>();

const fetcher = async (url: string): Promise<FounderRow[]> => {
  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to fetch founder rows");
  }

  return result.founders;
};

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain || !name) {
    return email;
  }

  if (name.length < 3) {
    return `***@${domain}`;
  }

  return `${name.slice(0, 1)}${"*".repeat(Math.max(3, name.length - 2))}${name.slice(-1)}@${domain}`;
}

export function DatabaseManager() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/founders", fetcher);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<FounderRow | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<FounderFormState>(EMPTY_FORM);

  const filtered = useMemo(() => {
    if (!data) return [];

    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) =>
      [
        row.founderName,
        row.companyName,
        row.industry,
        row.stage,
      ].join(" ").toLowerCase().includes(q),
    );
  }, [data, search]);

  async function refresh() {
    setStatus(null);
    await mutate();
  }

  async function toggleVerify(row: FounderRow) {
    setStatus("Updating verification status...");
    const response = await fetch(`/api/admin/founders/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !row.verified }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to toggle verification");
      return;
    }

    setStatus(`${row.founderName} is now ${row.verified ? "Pending" : "Verified"}.`);
    await mutate();
  }

  async function deleteRow(row: FounderRow) {
    const confirmDelete = window.confirm(
      `Delete ${row.founderName} (${row.companyName}) from directory?`,
    );
    if (!confirmDelete) return;

    setStatus("Deleting record...");
    const response = await fetch(`/api/admin/founders/${row.id}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to delete founder");
      return;
    }

    setStatus("Record deleted.");
    await mutate();
  }

  function openEdit(row: FounderRow) {
    setEditing(row);
    setForm({
      founderName: row.founderName,
      companyName: row.companyName,
      industry: row.industry,
      stage: row.stage,
      productSummary: row.productSummary,
      websiteUrl: row.websiteUrl ?? "",
      fundingInfo: row.fundingInfo ?? "",
      foundedYear: row.foundedYear ? String(row.foundedYear) : "",
    });
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsAddOpen(true);
  }

  function closeModal() {
    setEditing(null);
    setIsAddOpen(false);
    setForm(EMPTY_FORM);
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const payload = {
      founderName: form.founderName.trim(),
      companyName: form.companyName.trim(),
      industry: form.industry.trim(),
      stage: form.stage.trim(),
      productSummary: form.productSummary.trim(),
      websiteUrl: form.websiteUrl.trim() || undefined,
      fundingInfo: form.fundingInfo.trim() || undefined,
      foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
    };

    const endpoint = editing ? `/api/admin/founders/${editing.id}` : "/api/admin/founders";
    const method = editing ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok || !result.success) {
      setStatus(result.error ?? "Failed to save founder");
      return;
    }

    setStatus(editing ? "Founder record updated." : "Founder record created.");
    closeModal();
    await mutate();
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("founderName", {
        header: "Name",
        cell: (info) => (
          <div>
            <p className="text-sm font-medium text-white">{info.getValue()}</p>
            <p className="text-xs text-zinc-500">{info.row.original.companyName}</p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={
              info.getValue() === "VERIFIED"
                ? "rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                : "rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200"
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("tier", {
        header: "Tier",
        cell: (info) => (
          <span
            className={
              info.getValue() === "PRO"
                ? "rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-200"
                : "rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-zinc-300"
            }
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <span className="select-none text-sm text-zinc-300 blur-[3px] transition hover:blur-none">
            {maskEmail(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="rounded-md border border-white/15 bg-white/[0.03] px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-white/30"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toggleVerify(row)}
                className="rounded-md border border-indigo-400/35 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                {row.verified ? "Unverify" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => deleteRow(row)}
                className="rounded-md border border-red-400/35 bg-red-500/10 px-2 py-1 text-xs text-red-200 transition-colors hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          );
        },
      }),
    ],
    [data],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Database Manager</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage founder and startup records without leaving the admin dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-3 text-sm text-zinc-200 transition-colors hover:border-white/30"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#6366f1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#5558ea]"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 backdrop-blur-md">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search founders, companies, industry..."
          className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-indigo-400/40"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left">
            <thead className="bg-black/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-400"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td className="px-3 py-5 text-sm text-zinc-400" colSpan={5}>
                    Loading founder records...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-3 py-5 text-sm text-red-300" colSpan={5}>
                    {(error as Error).message}
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-5 text-sm text-zinc-500" colSpan={5}>
                    No records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {status ? (
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {status}
        </p>
      ) : null}

      {(isAddOpen || editing) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-[#0a0a0a] p-5 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editing ? "Edit Founder Record" : "Add New Startup Record"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-300 transition-colors hover:text-white"
              >
                Close
              </button>
            </div>

            <form className="grid gap-3 md:grid-cols-2" onSubmit={submitForm}>
              <input
                required
                value={form.founderName}
                onChange={(event) => setForm((current) => ({ ...current, founderName: event.target.value }))}
                placeholder="Founder Name"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                required
                value={form.companyName}
                onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                placeholder="Company Name"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                required
                value={form.industry}
                onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}
                placeholder="Industry"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                required
                value={form.stage}
                onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                placeholder="Stage (Seed, Series A...)"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={form.websiteUrl}
                onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))}
                placeholder="Website URL"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={form.foundedYear}
                onChange={(event) => setForm((current) => ({ ...current, foundedYear: event.target.value }))}
                placeholder="Founded Year"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
              <input
                value={form.fundingInfo}
                onChange={(event) => setForm((current) => ({ ...current, fundingInfo: event.target.value }))}
                placeholder="Funding Info"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
              />
              <textarea
                required
                value={form.productSummary}
                onChange={(event) => setForm((current) => ({ ...current, productSummary: event.target.value }))}
                placeholder="Product Summary"
                rows={4}
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100 md:col-span-2"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
