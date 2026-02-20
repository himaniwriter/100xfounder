import { buildPrimaryLinkedInAvatar } from "@/lib/founders/linkedin";
import { cn } from "@/lib/utils";

type FounderAvatarProps = {
  name: string;
  imageUrl?: string | null;
  linkedinUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function hashValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gradientFromName(name: string) {
  const palette = [
    ["#3b82f6", "#6366f1", "#0f172a"],
    ["#22d3ee", "#3b82f6", "#111827"],
    ["#8b5cf6", "#6366f1", "#0f172a"],
    ["#0ea5e9", "#7c3aed", "#111827"],
  ];
  const [first, second, third] = palette[hashValue(name) % palette.length];
  return {
    backgroundImage: `radial-gradient(circle at 24% 22%, ${first}, transparent 48%), radial-gradient(circle at 78% 26%, ${second}, transparent 50%), linear-gradient(145deg, ${third}, #050505 76%)`,
  };
}

export function FounderAvatar({
  name,
  imageUrl,
  linkedinUrl,
  className,
  imageClassName,
}: FounderAvatarProps) {
  const activeSource =
    (imageUrl && imageUrl.trim()) ||
    buildPrimaryLinkedInAvatar({
      linkedinUrl,
      founderName: name,
    });

  return (
    <div
      className={cn("relative grid h-full w-full place-items-center overflow-hidden bg-black/35", className)}
      style={gradientFromName(name)}
      aria-label={`${name} avatar fallback`}
    >
      {activeSource ? (
        <img
          src={activeSource}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            imageClassName,
          )}
        />
      ) : null}
      <svg
        viewBox="0 0 48 48"
        className={cn("h-6 w-6 text-white/75", activeSource ? "opacity-20" : "opacity-100")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="24" cy="17" r="8" fill="currentColor" />
        <path d="M9 39c1.8-7.2 7.7-11 15-11s13.2 3.8 15 11" fill="currentColor" />
      </svg>
    </div>
  );
}
