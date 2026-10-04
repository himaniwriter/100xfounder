import type { Metadata } from "next";
import { FeatureForm } from "@/components/launch/feature-form";
import { isDatabaseConfigured } from "@/lib/db-config";
import { getFeatureInvite } from "@/lib/launch/spotlights";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Founder Spotlight | 100xFounder",
  robots: { index: false, follow: false },
};

type PageProps = { params: { token: string } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-14 text-[#EDEDED]">
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </main>
  );
}

export default async function FeaturePage({ params }: PageProps) {
  const invite = isDatabaseConfigured() ? await getFeatureInvite(params.token).catch(() => null) : null;

  if (!invite || invite.status === "unsubscribed") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-white">This invite link isn't valid</h1>
        <p className="mt-3 text-zinc-400">
          It may have expired. Reply to our email and we'll send you a fresh link.
        </p>
      </Shell>
    );
  }

  if (invite.spotlight) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-white">Thanks, we've got your story!</h1>
        <p className="mt-3 text-zinc-400">
          {invite.spotlight.status === "published"
            ? "Your spotlight is live."
            : "We'll review it and let you know when it's live."}
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Free founder spotlight</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
        Tell us the story behind {invite.product.name}
      </h1>
      <p className="mt-4 text-zinc-300">
        Your answers become a founder spotlight on 100xFounder, with a link to {invite.product.name},
        and (if you opt in) a carousel post on our Instagram @100x.founder. It takes about 5 minutes.
      </p>
      <FeatureForm token={params.token} productName={invite.product.name} />
    </Shell>
  );
}
