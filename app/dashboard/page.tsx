import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ClaimPanel } from "@/components/dashboard/claim-panel";
import { AdminConnectorsPanel } from "@/components/dashboard/admin-connectors-panel";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getFounderDirectory } from "@/lib/founders/store";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  const founderOptions = (await getFounderDirectory({ limit: 200 })).map((item) => ({
    slug: item.slug,
    founderName: item.founderName,
    companyName: item.companyName,
  }));

  let dbWarning: string | null = null;
  let claims: Array<{
    id: string;
    status: string;
    founderEntry: { slug: string; founderName: string; companyName: string };
  }> = [];
  let connectors: Array<{
    id: string;
    name: string;
    provider: string;
    endpoint: string;
    authHeader: string | null;
    isActive: boolean;
    lastSyncAt: Date | null;
  }> = [];

  try {
    claims = await prisma.claimRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        founderEntry: {
          select: {
            slug: true,
            founderName: true,
            companyName: true,
          },
        },
      },
    });

    if (session.role === "ADMIN") {
      connectors = await prisma.aggregatorConnection.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          provider: true,
          endpoint: true,
          authHeader: true,
          isActive: true,
          lastSyncAt: true,
        },
      });
    }
  } catch {
    dbWarning =
      "Database tables are not ready. Run Prisma migrations to enable claims/connectors.";
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Logged in as {session.email} ({session.role})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-md border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
              >
                Admin Console
              </Link>
            ) : null}
            <Link
              href="/founders"
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
            >
              Browse Directory
            </Link>
          </div>
        </div>

        {dbWarning ? (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {dbWarning}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <ClaimPanel founderOptions={founderOptions} />

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-base font-medium text-white">My Claim Requests</h2>
            <div className="mt-4 space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-lg border border-white/10 bg-black/30 p-3"
                >
                  <p className="text-sm text-zinc-200">
                    {claim.founderEntry.founderName} - {claim.founderEntry.companyName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">Status: {claim.status}</p>
                </div>
              ))}
              {claims.length === 0 ? (
                <p className="text-xs text-zinc-500">No claims submitted yet.</p>
              ) : null}
            </div>
          </div>
        </div>

        {session.role === "ADMIN" ? (
          <div className="mt-6">
            <AdminConnectorsPanel initialConnectors={connectors} />
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
