"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinNewsletter, type JoinNewsletterState } from "@/app/(public)/newsletter/actions";
import { KineticLine } from "@/components/home/kinetic-line";
import { ArrowCircle } from "@/components/ui/arrow-circle";

const initialState: JoinNewsletterState = {
  ok: false,
  error: null,
};

const fieldClassName =
  "w-full border-b border-[#000000] bg-transparent py-3 text-[18px] text-[#000000] placeholder:text-[#777777] focus:border-[#777777] focus:outline-none disabled:opacity-60";

export function NewsletterSignup() {
  const [state, formAction, isPending] = useActionState(joinNewsletter, initialState);

  return (
    <section className="bg-[#ffffff] text-[#000000]">
      <div className="mx-auto grid w-full max-w-[88rem] gap-16 px-6 py-28 lg:grid-cols-[0.85fr_1.15fr] lg:px-12 lg:py-40">
        <div>
          <KineticLine className="flex items-end gap-7 text-[14px] leading-none font-semibold tracking-[0.3em] text-[#303030] uppercase">
            <span>Stay up to date</span>
            <span className="h-0.5 w-14 bg-[#000000]" />
          </KineticLine>
          <KineticLine
            as="p"
            delay={50}
            variant="headline"
            className="mt-14 max-w-xl font-serif text-[clamp(2.35rem,4.4vw,5rem)] leading-[1.03] font-light tracking-[-0.025em]"
          >
            Sign up for early access and the occasional note on what we are building.
          </KineticLine>
        </div>
        <KineticLine delay={80} className="flex flex-col justify-end">
          {state.ok ? (
            <p
              role="status"
              aria-live="polite"
              className="border-t border-[#000000] pt-10 text-[18px] font-medium"
            >
              You&apos;re on the list. We&apos;ll write when there&apos;s something worth sending.
            </p>
          ) : (
            <form
              action={formAction}
              className="flex flex-col gap-8 border-t border-[#000000] pt-10"
            >
              <div className="sr-only">
                <label>
                  Fax
                  <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="sr-only">First name</span>
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="First name"
                    maxLength={80}
                    required
                    disabled={isPending}
                    className={fieldClassName}
                  />
                </label>
                <label className="block">
                  <span className="sr-only">KCL email address</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="KCL email address"
                    maxLength={254}
                    required
                    disabled={isPending}
                    className={fieldClassName}
                  />
                </label>
              </div>
              <label className="flex max-w-xl items-start gap-3 text-[13px] leading-5 text-[#303030]">
                <input
                  type="checkbox"
                  name="consent"
                  value="on"
                  required
                  disabled={isPending}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#000000]"
                />
                <span>
                  Email me occasional notes at this KCL address. Unsubscribe anytime. See{" "}
                  <Link href="/privacy" className="underline underline-offset-2">
                    Privacy
                  </Link>
                  .
                </span>
              </label>
              {state.error ? (
                <p role="alert" className="text-[15px] text-[#303030]">
                  {state.error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="group inline-flex w-fit items-center gap-4 text-[18px] font-medium text-[#000000] disabled:opacity-60"
              >
                <span>{isPending ? "Joining…" : "Join the early cohort"}</span>
                <ArrowCircle tone="onLight" className="h-12 w-12" />
              </button>
            </form>
          )}
        </KineticLine>
      </div>
    </section>
  );
}
