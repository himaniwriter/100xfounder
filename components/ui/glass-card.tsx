import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "elevated" | "bordered" | "subtle";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: GlassCardVariant;
};

const variantClasses: Record<GlassCardVariant, string> = {
  default:
    "rounded-[14px] border border-white/8 bg-white/[0.03] backdrop-blur-md",
  elevated:
    "rounded-[14px] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-card",
  bordered:
    "rounded-[14px] border border-white/12 bg-transparent",
  subtle:
    "rounded-[14px] border border-white/6 bg-white/[0.02]",
};

export function GlassCard({
  variant = "default",
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        "transition-all duration-200",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
