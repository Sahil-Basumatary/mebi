import Link from "next/link";
import { RouteState } from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";

export default function AppNotFound() {
  return (
    <RouteState
      eyebrow="404"
      title="Page not found."
      description="That route is not in your workspace."
      action={
        <AppButton asChild>
          <Link href="/home">Back to home</Link>
        </AppButton>
      }
    />
  );
}
