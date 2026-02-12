import Link from "next/link";

type FounderCalloutProps = {
  founderName: string;
  founderSlug: string;
  companyName: string;
};

export function FounderCallout({
  founderName,
  founderSlug,
  companyName,
}: FounderCalloutProps) {
  return (
    <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-wide text-zinc-500">Founder Callout</p>
      <h4 className="mt-2 text-sm font-semibold text-white">{founderName}</h4>
      <p className="mt-1 text-xs text-zinc-400">{companyName}</p>
      <Link
        href={`/founders/${founderSlug}`}
        className="mt-3 inline-flex text-xs text-indigo-300 transition-colors hover:text-indigo-200"
      >
        Open directory profile
      </Link>
    </aside>
  );
}
