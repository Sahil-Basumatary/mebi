"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingState } from "./actions";

type OnboardingFormProps = {
  initialValues: {
    fullName: string;
    username: string;
    bio: string;
    imageUrl: string;
    skills: string;
    interests: string;
    role: "BUILDER" | "SPECIALIST" | "LEARNER" | "";
    prefersSolo: boolean;
  };
};

function roleCardLabel(role: "BUILDER" | "SPECIALIST" | "LEARNER"): string {
  if (role === "BUILDER") return "Builder";
  if (role === "SPECIALIST") return "Specialist";
  return "Learner";
}

function roleCardDescription(role: "BUILDER" | "SPECIALIST" | "LEARNER"): string {
  if (role === "BUILDER") return "I want to build portfolio projects with reliable teammates.";
  if (role === "SPECIALIST") return "I want to apply a strong technical niche to focused projects.";
  return "I am still learning and want beginner-friendly project partners.";
}

export function OnboardingForm({ initialValues }: OnboardingFormProps) {
  const initialState: OnboardingState = { error: null };
  const [state, formAction, isPending] = useActionState(completeOnboarding, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <section className="border border-[#262626] bg-[#0b0b0b] p-6">
        <div className="mb-6 flex items-center justify-between border-b border-[#1f1f1f] pb-4">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.24em] text-[#8f8f8f] uppercase">
              Identity
            </p>
            <p className="mt-1 text-sm text-[#d8d8d8]">The public face of your project profile.</p>
          </div>
          <span className="hidden rounded-full border border-[#262626] px-3 py-1 text-xs text-[#d8d8d8] sm:inline-flex">
            Required
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Name *
            </span>
            <input
              name="fullName"
              defaultValue={initialValues.fullName}
              required
              maxLength={120}
              className="border-b border-[#262626] bg-transparent px-1 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="Sahil Basumatary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Nickname
            </span>
            <input
              name="username"
              defaultValue={initialValues.username}
              maxLength={40}
              className="border-b border-[#262626] bg-transparent px-1 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="sahil"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Profile picture URL
            </span>
            <input
              name="imageUrl"
              type="url"
              defaultValue={initialValues.imageUrl}
              maxLength={500}
              className="border-b border-[#262626] bg-transparent px-1 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Bio
            </span>
            <textarea
              name="bio"
              defaultValue={initialValues.bio}
              maxLength={400}
              rows={4}
              className="resize-none border border-[#262626] bg-[#000000] px-4 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="What are you building and what kind of teammate are you looking for?"
            />
          </label>
        </div>
      </section>

      <section className="border border-[#262626] bg-[#0b0b0b] p-6">
        <div className="mb-6 border-b border-[#1f1f1f] pb-4">
          <p className="text-[12px] font-semibold tracking-[0.24em] text-[#8f8f8f] uppercase">
            Skills and interests
          </p>
          <p className="mt-1 text-sm text-[#d8d8d8]">Tags make matching precise and browsable.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Skills (comma separated)
            </span>
            <input
              name="skills"
              defaultValue={initialValues.skills}
              className="border-b border-[#262626] bg-transparent px-1 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="TypeScript, React, PostgreSQL"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-semibold tracking-[0.18em] text-[#8f8f8f] uppercase">
              Interests (comma separated)
            </span>
            <input
              name="interests"
              defaultValue={initialValues.interests}
              className="border-b border-[#262626] bg-transparent px-1 py-3 text-[#ffffff] outline-none placeholder:text-[#606060] focus:border-[#ffffff]"
              placeholder="Fintech, Cybersecurity, AI"
            />
          </label>
        </div>
      </section>

      <section className="border border-[#262626] bg-[#0b0b0b] p-6">
        <div className="mb-6 border-b border-[#1f1f1f] pb-4">
          <p className="text-[12px] font-semibold tracking-[0.24em] text-[#8f8f8f] uppercase">
            Your role
          </p>
          <p className="mt-1 text-sm text-[#d8d8d8]">Choose the default lens for your workspace.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["BUILDER", "SPECIALIST", "LEARNER"] as const).map((role) => (
            <label key={role}>
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={initialValues.role === role}
                className="peer sr-only"
              />
              <div className="h-full border border-[#262626] bg-[#000000] p-4 transition-colors hover:bg-[#050505] peer-checked:border-[#ffffff] peer-checked:bg-[#050505]">
                <p className="text-sm font-semibold">{roleCardLabel(role)}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#d8d8d8]">
                  {roleCardDescription(role)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="border border-[#262626] bg-[#0b0b0b] p-6">
        <p className="mb-4 text-[12px] font-semibold tracking-[0.24em] text-[#8f8f8f] uppercase">
          Partnering preference
        </p>
        <label className="flex items-center gap-3 text-sm">
          <input
            name="prefersSolo"
            type="checkbox"
            defaultChecked={initialValues.prefersSolo}
            className="h-4 w-4 rounded border-[#262626]"
          />
          <span>I plan to focus on solo projects for now</span>
        </label>
      </section>

      {state.error ? (
        <p className="border border-notification/30 bg-notification/10 px-3 py-2 text-sm text-notification">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <Button type="submit" size="lg" disabled={isPending} className="rounded-full px-7">
          {isPending ? "Saving profile..." : "Complete onboarding"}
        </Button>
      </div>
    </form>
  );
}
