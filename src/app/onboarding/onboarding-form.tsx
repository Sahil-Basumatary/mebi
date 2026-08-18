"use client";

import { useActionState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { TagCombobox } from "@/components/ui/tag-combobox";
import { INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/expertise-options";
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
  if (role === "BUILDER") return "I want to ship projects with reliable teammates.";
  if (role === "SPECIALIST") return "I want to apply a technical niche to focused work.";
  return "I am still learning and want beginner-friendly partners.";
}

const fieldClass =
  "border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-accent border px-3 py-3 text-sm outline-none";

export function OnboardingForm({ initialValues }: OnboardingFormProps) {
  const initialState: OnboardingState = { error: null };
  const [state, formAction, isPending] = useActionState(completeOnboarding, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <section className="border-app-divider bg-app-paper border p-5">
        <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">Identity</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Name *
            </span>
            <input
              name="fullName"
              defaultValue={initialValues.fullName}
              required
              maxLength={120}
              className={fieldClass}
              placeholder="Sahil Basumatary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Nickname
            </span>
            <input
              name="username"
              defaultValue={initialValues.username}
              maxLength={40}
              className={fieldClass}
              placeholder="sahil"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Profile picture URL
            </span>
            <input
              name="imageUrl"
              type="url"
              defaultValue={initialValues.imageUrl}
              maxLength={500}
              className={fieldClass}
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Bio
            </span>
            <textarea
              name="bio"
              defaultValue={initialValues.bio}
              maxLength={400}
              rows={4}
              className={`${fieldClass} resize-none leading-6`}
              placeholder="What you are building and who you want to work with."
            />
          </label>
        </div>
      </section>

      <section className="border-app-divider bg-app-paper border p-5">
        <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Skills and interests
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Skills
            </span>
            <TagCombobox
              name="skills"
              label="Skills"
              options={SKILL_OPTIONS}
              defaultValue={initialValues.skills}
              placeholder="Search skills"
              hint="Search the list, or choose Other to add your own."
            />
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
              Interests
            </span>
            <TagCombobox
              name="interests"
              label="Interests"
              options={INTEREST_OPTIONS}
              defaultValue={initialValues.interests}
              placeholder="Search interests"
              hint="Search the list, or choose Other to add your own."
            />
          </div>
        </div>
      </section>

      <section className="border-app-divider bg-app-paper border p-5">
        <p className="text-app-label text-xs font-semibold tracking-[0.14em] uppercase">
          Your role
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["BUILDER", "SPECIALIST", "LEARNER"] as const).map((role) => (
            <label key={role}>
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={initialValues.role === role}
                className="peer sr-only"
              />
              <div className="border-app-divider bg-app-wash hover:border-app-accent peer-checked:border-app-accent peer-checked:bg-app-paper h-full border p-4 transition-colors">
                <p className="text-sm font-semibold">{roleCardLabel(role)}</p>
                <p className="text-app-body mt-2 text-sm leading-5">{roleCardDescription(role)}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="border-app-divider bg-app-paper border p-5">
        <p className="text-app-label mb-3 text-xs font-semibold tracking-[0.14em] uppercase">
          Partnering preference
        </p>
        <label className="text-app-body flex items-center gap-3 text-sm">
          <input
            name="prefersSolo"
            type="checkbox"
            defaultChecked={initialValues.prefersSolo}
            className="accent-app-accent h-4 w-4"
          />
          <span>I plan to focus on solo projects for now</span>
        </label>
      </section>

      {state.error ? (
        <p
          role="alert"
          className="border-app-signal/30 bg-app-signal/10 text-app-signal border px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <AppButton type="submit" disabled={isPending}>
          {isPending ? "Saving profile..." : "Complete onboarding"}
        </AppButton>
      </div>
    </form>
  );
}
