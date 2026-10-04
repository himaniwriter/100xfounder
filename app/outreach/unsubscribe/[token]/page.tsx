import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe | 100xFounder",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: { token: string };
  searchParams: { done?: string };
};

export default function UnsubscribePage({ params, searchParams }: PageProps) {
  const done = searchParams.done === "1";
  const failed = searchParams.done === "0";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-[#EDEDED]">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">
          {done ? "You're unsubscribed" : "Unsubscribe from 100xFounder"}
        </h1>
        {done ? (
          <p className="mt-3 text-sm text-zinc-400">We won't email you again. Sorry for the bother!</p>
        ) : failed ? (
          <p className="mt-3 text-sm text-zinc-400">
            This link has expired. Reply to our email with “unsubscribe” and we'll remove you.
          </p>
        ) : (
          <form method="post" action={`/api/outreach/unsubscribe/${params.token}`} className="mt-6">
            <p className="text-sm text-zinc-400">Click below and we won't email you again.</p>
            <button
              type="submit"
              className="mt-5 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Unsubscribe
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
