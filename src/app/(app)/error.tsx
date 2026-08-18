"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RouteState } from "@/components/layout/route-state";
import { AppButton } from "@/components/ui/app-button";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteState
      eyebrow="Error"
      title="This page failed to load."
      description="Try again. Your other builds are still here."
      action={
        <>
          <AppButton type="button" onClick={reset}>
            Try again
          </AppButton>
          <AppButton asChild variant="secondary">
            <Link href="/home">Back to home</Link>
          </AppButton>
        </>
      }
    />
  );
}
