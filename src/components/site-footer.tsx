"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { useCookieConsent } from "@/components/cookie-consent-provider";
import { cn } from "@/lib/utils";

type SiteFooterProps = {
  variant: "marketing" | "public" | "compact";
};

const MARKETING_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#network", label: "The Network" },
      { href: "/#operating-system", label: "How it works" },
      { href: "/#proof-layer", label: "Proof layer" },
      { href: "/#builders", label: "For builders" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Log in" },
      { href: "/sign-up", label: "Sign up" },
    ],
  },
];

const PUBLIC_COLUMNS = [
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Log in" },
      { href: "/sign-up", label: "Sign up" },
      { href: "/", label: "Home" },
    ],
  },
];

function CookieSettingsButton({ className }: { className: string }) {
  const { openCustomize } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openCustomize}
      className={cn("cursor-pointer bg-transparent p-0 text-left", className)}
    >
      Cookie settings
    </button>
  );
}

export function SiteFooter({ variant }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const linkClass =
    variant === "public"
      ? "text-app-chrome-muted hover:text-app-chrome-fg text-sm transition-colors"
      : "text-[14px] text-[#8f8f8f] transition-colors hover:text-[#ffffff]";
  const headingClass =
    variant === "public"
      ? "text-app-chrome-fg text-xs font-semibold tracking-[0.14em] uppercase"
      : "text-[12px] font-semibold tracking-[0.14em] text-[#ffffff] uppercase";

  if (variant === "compact") {
    return (
      <footer className="relative z-10 w-full px-6 py-6">
        <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[#6f6f6f]">
          <span>© {year} Hackollab</span>
          <Link href="/privacy" className="hover:text-[#ffffff]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#ffffff]">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-[#ffffff]">
            Contact
          </Link>
          <CookieSettingsButton className="hover:text-[#ffffff]" />
        </div>
      </footer>
    );
  }

  const columns = variant === "marketing" ? MARKETING_COLUMNS : PUBLIC_COLUMNS;
  const inner =
    variant === "marketing"
      ? "mx-auto grid max-w-[88rem] gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr] lg:px-12 lg:py-20"
      : "mx-auto grid max-w-5xl gap-10 px-6 py-12 sm:grid-cols-[1fr_1fr]";

  return (
    <footer
      className={cn(
        variant === "marketing"
          ? "border-t border-[#262626] bg-[#000000] text-[#8f8f8f]"
          : "border-app-chrome-border bg-app-chrome text-app-chrome-muted border-t",
      )}
    >
      <div className={inner}>
        <div className="max-w-sm">
          <Link href="/" aria-label="Hackollab home">
            <BrandMark variant="white" className={variant === "marketing" ? "h-12" : "h-8"} />
          </Link>
          <p
            className={cn(
              "mt-5 text-[14px] leading-6",
              variant === "public" ? "text-app-chrome-muted" : "text-[#8f8f8f]",
            )}
          >
            KCL-only network for students who want project partners, shipped work, and proof they
            can take into interviews.
          </p>
        </div>
        <div
          className={cn("grid gap-10 sm:grid-cols-2", variant === "marketing" && "lg:grid-cols-3")}
        >
          {columns.map((column) => (
            <div key={column.title}>
              <p className={headingClass}>{column.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className={headingClass}>Legal</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClass}>
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/support" className={linkClass}>
                  Get support
                </Link>
              </li>
              <li>
                <CookieSettingsButton className={linkClass} />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "border-t",
          variant === "marketing" ? "border-[#262626]" : "border-app-chrome-border",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1 px-6 py-5 text-[12px] sm:flex-row sm:items-center sm:justify-between",
            variant === "marketing"
              ? "mx-auto max-w-[88rem] text-[#6f6f6f] lg:px-12"
              : "mx-auto max-w-5xl",
          )}
        >
          <p>© {year} Hackollab. Built for KCL student builders.</p>
          <p>King&apos;s College London</p>
        </div>
      </div>
    </footer>
  );
}
