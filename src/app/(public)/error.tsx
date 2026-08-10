"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RouteState } from "@/components/layout/route-state";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicError({ error, reset }: PublicErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteState
      eyebrow="Error"
      title="This page failed to load."
      description="Try again in a moment."
      action={
        <>
          <button
            type="button"
            onClick={reset}
            className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-app-divider text-app-ink hover:bg-app-wash inline-flex h-10 items-center border px-5 text-sm font-medium transition-colors"
          >
            Back home
          </Link>
        </>
      }
    />
  );
}
