import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SkipLink } from "@/components/layout/skip-link";
import { AppButton } from "@/components/ui/app-button";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-app-canvas text-app-ink min-h-full">
      <SkipLink />
      <header className="border-app-chrome-border bg-app-chrome text-app-chrome-fg border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center">
            <BrandMark variant="white" className="h-7" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-app-chrome-muted hover:text-app-chrome-fg text-sm transition-colors"
            >
              Privacy
            </Link>
            <AppButton asChild size="sm">
              <Link href="/sign-up">Build with us</Link>
            </AppButton>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-6 outline-none">
        {children}
      </main>
    </div>
  );
}
