import { cn } from "@/lib/utils";

type NewsCoverImageProps = {
  title: string;
  imageUrl?: string | null;
  uniqueId: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

function optimizeCoverSource(rawSource: string, priority: boolean): string {
  const source = rawSource.trim();
  if (!source) {
    return source;
  }

  if (!/^https?:\/\//i.test(source)) {
    return source;
  }

  try {
    const parsed = new URL(source);
    if (parsed.hostname.includes("images.unsplash.com")) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", priority ? "1280" : "960");
      parsed.searchParams.set("q", priority ? "68" : "58");
      return parsed.toString();
    }

    if (parsed.hostname.includes("images.yourstory.com")) {
      if (!parsed.searchParams.has("auto")) {
        parsed.searchParams.set("auto", "format");
      }
      if (!parsed.searchParams.has("q")) {
        parsed.searchParams.set("q", priority ? "70" : "60");
      }
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return source;
  }
}

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fallbackGradient(seed: string) {
  const palette = [
    ["#1d4ed8", "#6366f1", "#111827"],
    ["#7c3aed", "#2563eb", "#111827"],
    ["#0ea5e9", "#3b82f6", "#0f172a"],
  ];
  const [first, second, third] = palette[hashValue(seed) % palette.length];

  return {
    backgroundImage: `radial-gradient(circle at 20% 20%, ${first}, transparent 52%), radial-gradient(circle at 78% 30%, ${second}, transparent 54%), linear-gradient(150deg, ${third}, #020617 82%)`,
  };
}

function topicFallbackImage(title: string): string {
  const value = title.toLowerCase();
  if (/fund|round|deal|capital|valuation|investor|finance/.test(value)) {
    return "/images/covers/funding-wire.svg";
  }
  if (/ai|genai|machine|model|yc/.test(value)) {
    return "/images/covers/ai-grid.svg";
  }
  if (/hiring|talent|team|culture|people/.test(value)) {
    return "/images/covers/talent-map.svg";
  }
  return "/images/covers/startup-brief.svg";
}

export function NewsCoverImage({
  title,
  imageUrl,
  uniqueId,
  className,
  imageClassName,
  priority = false,
}: NewsCoverImageProps) {
  const activeSource = optimizeCoverSource(
    (imageUrl && imageUrl.trim()) || topicFallbackImage(title),
    priority,
  );

  return (
    <div
      className={cn(
        "relative grid h-full w-full place-items-center overflow-hidden bg-black/35 text-zinc-300",
        className,
      )}
      style={fallbackGradient(uniqueId)}
      aria-label={`${title} fallback cover`}
    >
      {activeSource ? (
        <img
          src={activeSource}
          alt={title}
          width={1600}
          height={900}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            imageClassName,
          )}
        />
      ) : null}
      <div
        className={cn("inline-flex rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-zinc-200", activeSource ? "opacity-0" : "opacity-100")}
      >
        Startup Intelligence
      </div>
    </div>
  );
}
