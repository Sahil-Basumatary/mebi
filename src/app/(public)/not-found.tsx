import Link from "next/link";
import { RouteState } from "@/components/layout";
import { AppButton } from "@/components/ui/app-button";

export default function PublicNotFound() {
  return (
    <RouteState
      eyebrow="404"
      title="Build not found."
      description="This public page is missing or no longer published."
      action={
        <>
          <AppButton asChild>
            <Link href="/">Back home</Link>
          </AppButton>
          <AppButton asChild variant="secondary">
            <Link href="/sign-up">Build with us</Link>
          </AppButton>
        </>
      }
    />
  );
}
