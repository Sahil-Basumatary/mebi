import Link from "next/link";
import { KineticLine } from "@/components/home/kinetic-line";

export function NewsletterSignup() {
  return (
    <section className="bg-[#ffffff] text-[#000000]">
      <div className="mx-auto grid w-full max-w-[88rem] gap-16 px-6 py-28 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-40">
        <div>
          <KineticLine className="flex items-center gap-7 text-[12px] font-semibold tracking-[0.3em] text-[#303030] uppercase">
            <span>Stay up to date</span>
            <span className="h-px w-14 bg-[#000000]" />
          </KineticLine>
          <KineticLine
            as="p"
            delay={50}
            variant="headline"
            className="mt-14 max-w-xl font-[family-name:var(--font-newsreader)] text-[clamp(2.35rem,4.4vw,5rem)] leading-[1.03] font-light tracking-[-0.025em]"
          >
            Sign up for early access and the occasional note on what we are building.
          </KineticLine>
        </div>
        <KineticLine delay={80} className="flex flex-col justify-end">
          <div className="flex flex-col gap-8 border-t border-[#000000] pt-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <input
                type="text"
                placeholder="First name"
                className="border-b border-[#000000] bg-transparent py-3 text-[15px] text-[#000000] placeholder:text-[#777777] focus:border-[#777777] focus:outline-none"
              />
              <input
                type="email"
                placeholder="KCL email address"
                className="border-b border-[#000000] bg-transparent py-3 text-[15px] text-[#000000] placeholder:text-[#777777] focus:border-[#777777] focus:outline-none"
              />
            </div>
            <Link
              href="/sign-up?redirect_url=/onboarding"
              className="group inline-flex w-fit items-center gap-4 text-[15px] font-medium text-[#000000]"
            >
              <span>Join the early cohort</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#000000] text-xl leading-none transition-colors group-hover:bg-[#000000] group-hover:text-[#ffffff]">
                &rarr;
              </span>
            </Link>
          </div>
        </KineticLine>
      </div>
      <div className="border-t border-[#d8d8d8]">
        <div className="mx-auto flex w-full max-w-[88rem] flex-col justify-between gap-3 px-6 py-8 text-[12px] tracking-[0.04em] text-[#555555] sm:flex-row lg:px-12">
          <span>mebi — built for KCL student builders</span>
          <span>Find serious project partners before the idea dies</span>
        </div>
      </div>
    </section>
  );
}
