import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { RetentionDashboard } from "@/components/dashboard/retention-dashboard";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getNewsTopicSummaries } from "@/lib/blog/store";
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
  const companyOptions = Array.from(
    new Map(
      (await getFounderDirectory({ limit: 250 }))
        .map((item) => [
          item.companySlug,
          {
            companySlug: item.companySlug,
            companyName: item.companyName,
            founderName: item.founderName,
          },
        ]),
    ).values(),
  );
  const topicOptions = (await getNewsTopicSummaries())
    .slice(0, 60)
    .map((item) => ({
      slug: item.slug,
      label: item.label,
      count: item.count,
    }));

  let dbWarning: string | null = null;
  let claims: Array<{
    id: string;
    status: string;
    message: string | null;
    createdAt: string;
    reviewedAt: string | null;
    founderEntry: { slug: string; founderName: string; companyName: string };
  }> = [];
  let connectors: Array<{
    id: string;
    name: string;
    provider: string;
    endpoint: string;
    authHeader: string | null;
    isActive: boolean;
    lastSyncAt: string | null;
  }> = [];
  let profileName: string | null = session.name ?? null;
  let profileAvatarUrl: string | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        avatar: true,
      },
    });
    if (user) {
      profileName = user.name;
      profileAvatarUrl = user.avatar;
    }

    const claimRows = await prisma.claimRequest.findMany({
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
    claims = claimRows.map((claim) => ({
      ...claim,
      message: claim.message ?? null,
      createdAt: claim.createdAt.toISOString(),
      reviewedAt: claim.reviewedAt ? claim.reviewedAt.toISOString() : null,
    }));

    if (session.role === "ADMIN") {
      const connectorRows = await prisma.aggregatorConnection.findMany({
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
      connectors = connectorRows.map((connector) => ({
        ...connector,
        lastSyncAt: connector.lastSyncAt ? connector.lastSyncAt.toISOString() : null,
      }));
    }
  } catch {
    dbWarning =
      "Database tables are not ready. Run Prisma migrations to enable claims/connectors.";
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {dbWarning ? (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {dbWarning}
          </div>
        ) : null}

        <RetentionDashboard
          session={{
            email: session.email,
            role: session.role,
          }}
          profileName={profileName}
          profileAvatarUrl={profileAvatarUrl}
          founderOptions={founderOptions}
          companyOptions={companyOptions}
          topicOptions={topicOptions}
          claims={claims}
          adminConnectors={connectors}
        />

        {session.role === "ADMIN" ? (
          <div className="mt-6">
            <Link
              href="/admin"
              className="rounded-md border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
            >
              Open Admin Console
            </Link>
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
