import type { Metadata } from "next";
import Link from "next/link";
import { RouteState } from "@/components/layout/route-state";
import { AppButton } from "@/components/ui/app-button";
import { getNewsletterStatus } from "@/lib/newsletter";
import { confirmNewsletterUnsubscribe } from "@/app/(public)/newsletter/actions";

export const metadata: Metadata = {
  title: "Unsubscribe · Hackollab",
  robots: { index: false, follow: false },
};

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function NewsletterUnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;
  const status = await getNewsletterStatus(token);

  if (status === "invalid") {
    return (
      <RouteState
        eyebrow="Newsletter"
        title="This unsubscribe link is invalid."
        description="If you still get notes, use the latest link in a Hackollab email or write to us from Privacy."
        action={
          <AppButton asChild variant="secondary">
            <Link href="/">Back home</Link>
          </AppButton>
        }
      />
    );
  }

  if (status === "active") {
    return (
      <RouteState
        eyebrow="Newsletter"
        title="Leave the early-access list?"
        description="We'll stop emailing this address unless you join again from the home page."
        action={
          <form action={confirmNewsletterUnsubscribe}>
            <input type="hidden" name="token" value={token ?? ""} />
            <div className="flex flex-wrap gap-2">
              <AppButton type="submit">Unsubscribe</AppButton>
              <AppButton asChild variant="secondary">
                <Link href="/">Keep me on the list</Link>
              </AppButton>
            </div>
          </form>
        }
      />
    );
  }

  return (
    <RouteState
      eyebrow="Newsletter"
      title="You're off the list."
      description="We won't email this address again unless you rejoin from the home page."
      action={
        <AppButton asChild>
          <Link href="/">Back home</Link>
        </AppButton>
      }
    />
  );
}
