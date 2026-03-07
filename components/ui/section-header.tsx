import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    overline?: string;
    className?: string;
};

export function SectionHeader({
    title,
    subtitle,
    ctaLabel,
    ctaHref,
    overline,
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("mb-8", className)}>
            {overline ? (
                <p className="mb-2 text-overline uppercase text-zinc-500">
                    {overline}
                </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-heading-2 text-white">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1.5 max-w-2xl text-body text-zinc-400">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {ctaLabel && ctaHref ? (
                    <Link
                        href={ctaHref}
                        className="glass-ghost-btn glass-ghost-btn-compact shrink-0"
                    >
                        {ctaLabel}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                ) : null}
            </div>
        </div>
    );
}
