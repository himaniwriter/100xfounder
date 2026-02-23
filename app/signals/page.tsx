import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CompanyLogo } from "@/components/ui/company-logo";
import { getSignalsFeed } from "@/lib/signals/feed";

export const revalidate = 1800;

function toHeatmapLevel(count: number): "High" | "Medium" | "Low" {
  if (count >= 5) return "High";
  if (count >= 2) return "Medium";
  return "Low";
}

function classifyRoleBucket(role: string): string {
  const lower = role.toLowerCase();
  if (/engineer|developer|backend|frontend|fullstack|platform|devops/.test(lower)) return "Engineering";
  if (/sales|account|business development|bdm|revenue/.test(lower)) return "Sales";
  if (/product|pm|product manager/.test(lower)) return "Product";
  if (/design|ux|ui/.test(lower)) return "Design";
  if (/data|analytics|ml|ai/.test(lower)) return "Data";
  return "Operations";
}

function levelClass(level: "High" | "Medium" | "Low") {
  if (level === "High") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (level === "Medium") return "bg-yellow-500/15 text-yellow-200 border-yellow-400/30";
  return "bg-zinc-500/15 text-zinc-300 border-zinc-400/20";
}

export default async function SignalsPage() {
  const data = await getSignalsFeed(40);
  const items = data.items;
  const tickerItems = items.slice(0, 8).map((item) => {
    const round = item.lastRound !== "Undisclosed" ? item.lastRound : item.fundingTotal;
    return `${item.companyName} ${round}`;
  });

  const roleCounts = new Map<string, number>();
  items.forEach((item) => {
    if (!item.isHiring) {
      return;
    }

    const roles = item.hiringRoles.length > 0 ? item.hiringRoles : ["Operations"];
    roles.forEach((role) => {
      const bucket = classifyRoleBucket(role);
      roleCounts.set(bucket, (roleCounts.get(bucket) ?? 0) + 1);
    });
  });

  const hiringHeatmap = ["Engineering", "Sales", "Product", "Design", "Data", "Operations"].map(
    (role) => ({
      role,
      level: toHeatmapLevel(roleCounts.get(role) ?? 0),
    }),
  );

  const updatedLabel = data.updatedAt
    ? new Date(data.updatedAt).toLocaleString()
    : "Live sync";

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Signals Terminal</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Live startup funding and hiring indicators across India and US ecosystems.
          </p>
          <p className="mt-1 text-xs text-zinc-500">Last updated: {updatedLabel}</p>
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur-[40px]">
          <div className="ticker-track">
            <span>{tickerItems.length > 0 ? tickerItems.join(" • ") : "No live signals yet."}</span>
            <span aria-hidden="true">{tickerItems.length > 0 ? tickerItems.join(" • ") : "No live signals yet."}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
              Funding Feed
            </h2>

            <div className="mt-4 space-y-3">
              {items.slice(0, 18).map((item) => (
                <Link
                  key={item.id}
                  href={`/company/${item.companySlug}`}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 transition-colors hover:border-white/30 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-2">
                    <CompanyLogo
                      companyName={item.companyName}
                      className="h-7 w-7 rounded-md border border-white/15"
                    />
                    <p className="text-sm text-zinc-200">
                      <span className="font-medium text-white">{item.companyName}</span> • {item.lastRound}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-emerald-300">{item.fundingTotal}</p>
                    <p className="text-[11px] text-zinc-500">{item.country}</p>
                  </div>
                </Link>
              ))}
              {items.length === 0 ? (
                <p className="text-sm text-zinc-500">No signals available yet.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
              Hiring Heatmap
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {hiringHeatmap.map((item) => (
                <div
                  key={item.role}
                  className={`rounded-lg border px-3 py-2 text-xs ${levelClass(item.level)}`}
                >
                  <p className="font-medium">{item.role}</p>
                  <p className="mt-1 opacity-90">{item.level}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
