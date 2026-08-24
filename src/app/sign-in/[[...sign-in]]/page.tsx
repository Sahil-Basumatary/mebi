import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site-footer";
import { authAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#060606] text-[#ffffff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/auth-ribbon.jpg')" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#060606]/25" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href="/" aria-label="Hackollab home">
          <BrandMark variant="white" className="h-9" />
        </Link>
        <div className="mt-7 text-center">
          <h1 className="text-4xl leading-tight font-medium sm:text-5xl">Log in to Hackollab</h1>
          <p className="mt-3 text-[17px] text-[#a8a8a8]">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-[#4d8fd6] underline-offset-4 hover:underline"
            >
              Sign up.
            </Link>
          </p>
        </div>
        <div className="mt-8 w-full">
          <SignIn
            appearance={authAppearance}
            fallbackRedirectUrl="/start"
            forceRedirectUrl="/start"
          />
        </div>
        <p className="mt-8 text-center text-xs leading-6 text-[#6f6f6f]">
          By signing in, you return to a private project workspace for KCL builders.
        </p>
      </div>
      <SiteFooter variant="compact" />
    </main>
  );
}
