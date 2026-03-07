"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const mobileNavLinks = [
    { label: "Home", href: "/" },
    { label: "Directory", href: "/founders" },
    { label: "Startups", href: "/startups" },
    { label: "Signals", href: "/signals" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Countries", href: "/countries" },
    { label: "Industries", href: "/industries" },
    { label: "Stages", href: "/stages" },
    { label: "Topics", href: "/topics" },
    { label: "Search", href: "/search" },
    { label: "Get Featured", href: "/get-featured" },
    { label: "Interview Q&A", href: "/interview-questionnaire" },
    { label: "Guest Posts", href: "/guest-post-marketplace" },
];

export function MobileNavDrawer() {
    const [isOpen, setIsOpen] = useState(false);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="glass-ghost-btn glass-ghost-btn-icon md:hidden"
                aria-label="Open navigation menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Backdrop */}
            {isOpen ? (
                <div
                    className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            ) : null}

            {/* Drawer */}
            <div
                className={[
                    "fixed right-0 top-0 z-[61] flex h-full w-[280px] max-w-[85vw] flex-col border-l border-white/8 bg-[#0a0a0f] transition-transform duration-300 ease-out md:hidden",
                    isOpen ? "translate-x-0" : "translate-x-full",
                ].join(" ")}
            >
                <div className="flex h-14 items-center justify-between border-b border-white/8 px-4">
                    <span className="text-sm font-medium text-zinc-300">Menu</span>
                    <button
                        type="button"
                        onClick={close}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:text-white"
                        aria-label="Close navigation menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <div className="space-y-0.5">
                        {mobileNavLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={close}
                                className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-zinc-300 transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="border-t border-white/8 px-4 py-4">
                    <Link
                        href="/get-featured"
                        onClick={close}
                        className="glass-cta-btn w-full justify-center text-center"
                    >
                        Get Featured
                    </Link>
                </div>
            </div>
        </>
    );
}
