import Link from "next/link";
import type { ReactNode } from "react";
import { SkipLink } from "@/components/layout/skip-link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-app-wash text-app-ink min-h-full">
      <SkipLink />
      <header className="border-app-divider bg-app-paper border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-2xl font-light tracking-tight">
            Hackollab
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-app-label hover:text-app-ink text-sm transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/sign-up"
              className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors"
            >
              Build with us
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-10 outline-none">
        {children}
      </main>
    </div>
  );
}
