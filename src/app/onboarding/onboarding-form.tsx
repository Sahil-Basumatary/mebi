"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
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
    <form action={formAction} className="flex flex-col gap-6">
      <Panel title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">Name *</span>
            <input
              name="fullName"
              defaultValue={initialValues.fullName}
              required
              maxLength={120}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="Sahil Basumatary"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">Nickname</span>
            <input
              name="username"
              defaultValue={initialValues.username}
              maxLength={40}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="sahil"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">
              Profile picture URL
            </span>
            <input
              name="imageUrl"
              type="url"
              defaultValue={initialValues.imageUrl}
              maxLength={500}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="https://..."
            />
          </label>
          <label className="flex flex-col gap-2 text-sm sm:col-span-2">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">Bio</span>
            <textarea
              name="bio"
              defaultValue={initialValues.bio}
              maxLength={400}
              rows={4}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="What are you building and what kind of teammate are you looking for?"
            />
          </label>
        </div>
      </Panel>

      <Panel title="Skills and interests">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">
              Skills (comma separated)
            </span>
            <input
              name="skills"
              defaultValue={initialValues.skills}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="TypeScript, React, PostgreSQL"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted text-xs font-semibold tracking-wider uppercase">
              Interests (comma separated)
            </span>
            <input
              name="interests"
              defaultValue={initialValues.interests}
              className="bg-canvas rounded-md border border-border px-3 py-2 outline-none focus:border-border-strong"
              placeholder="Fintech, Cybersecurity, AI"
            />
          </label>
        </div>
      </Panel>

      <Panel title="Your role">
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
              <div className="bg-canvas peer-checked:border-border-strong hover:bg-hover h-full rounded-lg border border-border p-4 transition-colors">
                <p className="text-sm font-semibold">{roleCardLabel(role)}</p>
                <p className="text-muted mt-2 text-sm leading-relaxed">{roleCardDescription(role)}</p>
              </div>
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Partnering preference">
        <label className="flex items-center gap-3 text-sm">
          <input
            name="prefersSolo"
            type="checkbox"
            defaultChecked={initialValues.prefersSolo}
            className="h-4 w-4 rounded border-border"
          />
          <span>I plan to focus on solo projects for now</span>
        </label>
      </Panel>

      {state.error ? (
        <p className="rounded-md border border-notification/30 bg-notification/10 px-3 py-2 text-sm text-notification">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Saving profile..." : "Complete onboarding"}
        </Button>
      </div>
    </form>
  );
}
