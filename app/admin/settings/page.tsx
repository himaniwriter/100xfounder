export default function AdminSettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Environment, access, and platform-level operational controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Authentication
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Admin access is enforced on `/admin/*` and `/api/admin/*` routes.
          </p>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
            Integrations
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Configure N8N and Supabase secrets in environment variables before production.
          </p>
        </div>
      </div>
    </div>
  );
}
