import type { Metadata } from "next";
import Link from "next/link";
import { RouteState } from "@/components/layout/route-state";
import { AppButton } from "@/components/ui/app-button";

export const metadata: Metadata = {
  title: "Email preferences · Hackollab",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ ok?: string; k?: string }>;
};

export default async function EmailUnsubscribedPage({ searchParams }: PageProps) {
  const { ok, k } = await searchParams;
  if (ok !== "1") {
    return (
      <RouteState
        eyebrow="Email"
        title="This unsubscribe link is invalid."
        description="Sign in and use Settings → Notifications if you still want to change mail."
        action={
          <AppButton asChild variant="secondary">
            <Link href="/sign-in">Sign in</Link>
          </AppButton>
        }
      />
    );
  }

  const title =
    k === "digest" ? "Weekly digest turned off." : "Product update emails turned off.";

  return (
    <RouteState
      eyebrow="Email"
      title={title}
      description="You can turn them back on any time in Settings → Notifications."
      action={
        <AppButton asChild>
          <Link href="/sign-in">Sign in</Link>
        </AppButton>
      }
    />
  );
}
