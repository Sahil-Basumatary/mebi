import Link from "next/link";
import { RouteState } from "@/components/layout";

export default function PublicNotFound() {
  return (
    <RouteState
      eyebrow="404"
      title="Build not found."
      description="This public page is missing or no longer published."
      action={
        <>
          <Link
            href="/"
            className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
          >
            Back home
          </Link>
          <Link
            href="/sign-up"
            className="border-app-divider text-app-ink hover:bg-app-wash inline-flex h-10 items-center border px-5 text-sm font-medium transition-colors"
          >
            Build with us
          </Link>
        </>
      }
    />
  );
}
