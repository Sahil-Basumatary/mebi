import Link from "next/link";
import { RouteState } from "@/components/layout";

export default function AppNotFound() {
  return (
    <RouteState
      eyebrow="404"
      title="Page not found."
      description="That route is not in your workspace."
      action={
        <Link
          href="/home"
          className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
        >
          Back to home
        </Link>
      }
    />
  );
}
