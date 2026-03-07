"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type SocialShareBarProps = {
  url: string;
  title: string;
  description?: string;
  showFloatingMobile?: boolean;
};

type ShareButtonConfig = {
  key: "twitter" | "linkedin" | "whatsapp" | "facebook";
  label: string;
  href: string;
  icon: ReactNode;
};

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.27l-4.9-6.35L6.48 22H3.38l7.25-8.29L1 2h6.43l4.42 5.79L18.9 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3a1.96 1.96 0 100 3.92A1.96 1.96 0 005.25 3zM20.44 12.96c0-3.45-1.84-5.05-4.29-5.05-1.98 0-2.87 1.09-3.37 1.86V8.5H9.4V20h3.38v-6.2c0-1.64.31-3.23 2.34-3.23 2 0 2.02 1.87 2.02 3.33V20h3.3v-7.04z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2a10 10 0 00-8.67 15l-1.2 4.38 4.5-1.18A10 10 0 1012 2zm5.84 14.44c-.24.67-1.4 1.28-1.94 1.36-.5.07-1.15.1-1.86-.13-.43-.14-.98-.32-1.69-.63-2.96-1.27-4.89-4.4-5.04-4.6-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.6-.37.8-.37h.57c.18 0 .42-.07.65.48.24.58.8 2 .87 2.15.07.14.12.31.02.5-.1.2-.15.31-.3.47-.14.16-.31.36-.45.49-.14.14-.28.29-.12.56.16.27.72 1.18 1.55 1.91 1.06.95 1.95 1.24 2.23 1.38.28.14.44.12.6-.07.17-.2.7-.8.88-1.08.18-.27.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.47.2.54.31.07.12.07.7-.17 1.37z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.88 3.77-3.88 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0022 12z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M16 1H6a2 2 0 00-2 2v12h2V3h10V1zm3 4H10a2 2 0 00-2 2v14a2 2 0 002 2h9a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H10V7h9v14z" />
    </svg>
  );
}

export function SocialShareBar({
  url,
  title,
  description,
  showFloatingMobile = false,
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  const shareButtons = useMemo<ShareButtonConfig[]>(() => {
    const encodedUrl = encodeURIComponent(url);
    const shareTitle = description?.trim()
      ? `${title} — ${description.trim()}`
      : title;
    const encodedTitle = encodeURIComponent(shareTitle);

    return [
      {
        key: "twitter",
        label: "Tweet",
        href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        icon: <XIcon />,
      },
      {
        key: "linkedin",
        label: "LinkedIn",
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        icon: <LinkedInIcon />,
      },
      {
        key: "whatsapp",
        label: "WhatsApp",
        href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
        icon: <WhatsAppIcon />,
      },
      {
        key: "facebook",
        label: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        icon: <FacebookIcon />,
      },
    ];
  }, [description, title, url]);

  useEffect(() => {
    if (!showFloatingMobile) {
      return;
    }

    const handleScroll = () => {
      setShowFloating(window.scrollY > 200);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showFloatingMobile]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  const buttonBaseClass =
    "inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-[13px] text-zinc-300 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

  return (
    <>
      <div className="my-4 border-y border-white/8 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-overline uppercase text-zinc-500">Share</span>
          {shareButtons.map((button) => (
            <a
              key={button.key}
              href={button.href}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonBaseClass}
              aria-label={`${button.label} on ${button.key}`}
            >
              {button.icon}
              <span className="hidden sm:inline">{button.label}</span>
            </a>
          ))}
          <button
            type="button"
            onClick={handleCopy}
            className={buttonBaseClass}
            aria-live="polite"
          >
            <CopyIcon />
            <span className="hidden sm:inline">{copied ? "Copied ✓" : "Copy link"}</span>
          </button>
        </div>
      </div>

      {showFloatingMobile ? (
        <div
          className={[
            "fixed bottom-0 left-0 right-0 z-[65] border-t border-white/8 bg-[#050505]/95 px-3 py-2.5 backdrop-blur-lg transition-transform duration-200 sm:hidden",
            showFloating ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
        >
          <div className="grid grid-cols-5 gap-1.5">
            {shareButtons.map((button) => (
              <a
                key={`mobile-${button.key}`}
                href={button.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                aria-label={`Share on ${button.key}`}
              >
                {button.icon}
              </a>
            ))}
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"
              aria-label="Copy article link"
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
