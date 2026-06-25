import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { authAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060606] text-[#ffffff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/auth-ribbon.png')" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#060606]/45" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <Link
          href="/"
          aria-label="mebi home"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2b2b2b] bg-[#0f0f0f]/85 text-lg font-semibold shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur"
        >
          m
        </Link>

        <div className="mt-7 text-center">
          <h1 className="font-serif text-4xl leading-tight font-light tracking-[-0.04em] sm:text-5xl">
            Create your mebi account
          </h1>
          <p className="mt-3 text-sm text-[#a8a8a8]">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-[#ffffff] underline-offset-4 hover:underline">
              Log in.
            </Link>
          </p>
        </div>

        <div className="mt-8 w-full">
          <SignUp
            appearance={authAppearance}
            fallbackRedirectUrl="/onboarding"
            forceRedirectUrl="/onboarding"
          />
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-[#6f6f6f]">
          KCL-only access keeps the network accountable while the platform grows.
        </p>
      </div>
    </main>
  );
}
