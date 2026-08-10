"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RouteState } from "@/components/layout/route-state";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#000000] px-6 py-16 text-[#ffffff]">
      <RouteState
        tone="marketing"
        className="w-full max-w-xl"
        eyebrow="Error"
        title="Something broke."
        description="Refresh and try again. If it keeps failing, come back later."
        action={
          <>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center bg-[#ffffff] px-5 text-sm font-medium text-[#000000] transition-colors hover:bg-[#e6e6e6]"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center border border-[#262626] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#121212]"
            >
              Back home
            </Link>
          </>
        }
      />
    </main>
  );
}
