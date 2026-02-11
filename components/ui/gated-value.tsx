import Link from "next/link";

type GatedValueProps = {
  unlocked: boolean;
  blurredPreview: string;
  actualValue: string | null;
  ctaHref?: string;
  ctaLabel?: string;
};

export function GatedValue({
  unlocked,
  blurredPreview,
  actualValue,
  ctaHref = "/login",
  ctaLabel = "Unlock Contact Info",
}: GatedValueProps) {
  if (unlocked) {
    return <span className="text-zinc-100">{actualValue ?? "Not available"}</span>;
  }

  return (
    <span className="relative inline-flex min-h-8 items-center">
      <span className="select-none blur-sm">{blurredPreview}</span>
      <span className="absolute inset-0 flex items-center">
        <Link
          href={ctaHref}
          className="rounded bg-[#6366f1] px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-[#5558ea]"
        >
          {ctaLabel}
        </Link>
      </span>
    </span>
  );
}
