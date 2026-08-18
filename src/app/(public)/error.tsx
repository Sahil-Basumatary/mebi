"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RouteState } from "@/components/layout/route-state";
import { AppButton } from "@/components/ui/app-button";

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
          <AppButton type="button" onClick={reset}>
            Try again
          </AppButton>
          <AppButton asChild variant="secondary">
            <Link href="/">Back home</Link>
          </AppButton>
        </>
      }
    />
  );
}
