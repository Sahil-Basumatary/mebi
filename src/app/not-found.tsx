import Link from "next/link";
import { RouteState } from "@/components/layout";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#000000] px-6 py-16 text-[#ffffff]">
      <RouteState
        tone="marketing"
        className="w-full max-w-xl"
        eyebrow="404"
        title="Page not found."
        description="That URL does not exist on mebi."
        action={
          <>
            <Link
              href="/"
              className="inline-flex h-10 items-center bg-[#ffffff] px-5 text-sm font-medium text-[#000000] transition-colors hover:bg-[#e6e6e6]"
            >
              Back home
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-10 items-center border border-[#262626] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#121212]"
            >
              Sign in
            </Link>
          </>
        }
      />
    </main>
  );
}
