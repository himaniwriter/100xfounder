import { cn } from "@/lib/utils";

type HalfBlurValueProps = {
  value: string;
  className?: string;
};

function splitAtHalf(value: string): [string, string] {
  if (!value) {
    return ["", ""];
  }

  const midpoint = Math.max(1, Math.floor(value.length / 2));
  return [value.slice(0, midpoint), value.slice(midpoint)];
}

export function HalfBlurValue({ value, className }: HalfBlurValueProps) {
  const [visiblePart, blurredPart] = splitAtHalf(value);

  return (
    <span className={cn("inline-flex items-center", className)} aria-label={value}>
      <span>{visiblePart}</span>
      <span className="select-none blur-[2px]">{blurredPart}</span>
    </span>
  );
}

