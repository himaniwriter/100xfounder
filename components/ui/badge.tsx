import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "ghost";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
    default:
        "border-white/10 bg-white/5 text-zinc-300",
    primary:
        "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
    success:
        "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    warning:
        "border-amber-400/30 bg-amber-500/10 text-amber-200",
    ghost:
        "border-white/8 bg-transparent text-zinc-400",
};

export function Badge({
    variant = "default",
    className,
    children,
    ...props
}: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
                variantClasses[variant],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}
