"use client";

import { upload } from "@vercel/blob/client";
import { useActionState, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { SocialIcon } from "@/components/social-icon";
import { MAX_SOCIAL_LINKS } from "@/lib/social-links";
import { setAvatar, updateProfile, type ProfileState } from "./actions";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

const PRONOUN_PRESETS = ["they/them", "she/her", "he/him"];

function initialsFrom(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type ProfileFormProps = {
  email: string;
  onSaved?: () => void;
  initialValues: {
    fullName: string;
    username: string;
    bio: string;
    pronouns: string;
    imageUrl: string;
    githubUsername: string;
    showGithub: boolean;
    socialLinks: string[];
    skills: string;
    interests: string;
    role: "BUILDER" | "SPECIALIST" | "LEARNER" | "";
    prefersSolo: boolean;
    profilePrivate: boolean;
  };
};

const PRONOUN_OPTIONS = [
  { value: "", label: "Don't specify" },
  { value: "they/them", label: "they/them" },
  { value: "she/her", label: "she/her" },
  { value: "he/him", label: "he/him" },
  { value: "custom", label: "Custom" },
] as const;

// Prepend a scheme so the icon can be detected while the user is still typing a
// bare domain like "linkedin.com/in/…".
function iconPreview(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const ROLES = [
  { value: "BUILDER", label: "Builder" },
  { value: "SPECIALIST", label: "Specialist" },
  { value: "LEARNER", label: "Learner" },
] as const;

const inputClass =
  "w-full rounded-md border border-app-border bg-app-canvas px-3 py-2 text-sm text-app-fg outline-none transition-colors placeholder:text-app-muted-2 focus:border-app-fg";

// Notion-style subsection heading: 16px medium with a hairline divider beneath.
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-app-fg border-app-border mb-4 border-b pb-3 text-base font-medium">
      {children}
    </h3>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label ? (
        <label htmlFor={htmlFor} className="text-app-muted mb-1 block text-xs">
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-app-muted-2 mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  name,
  defaultChecked,
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  name: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  const isControlled = typeof checked === "boolean";
  return (
    <label
      className={`flex items-center justify-between gap-6 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
    >
      <span className="min-w-0">
        <span className="text-app-fg block text-sm font-medium">{label}</span>
        {hint ? (
          <span className="text-app-muted mt-0.5 block text-[13px] leading-[18px]">{hint}</span>
        ) : null}
      </span>
      <span className="relative inline-flex h-[18px] w-[30px] shrink-0 items-center">
        <input
          type="checkbox"
          name={name}
          disabled={disabled}
          {...(isControlled
            ? {
                checked,
                onChange: (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.checked),
              }
            : { defaultChecked })}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span className="bg-app-border-strong peer-checked:bg-app-accent h-[18px] w-[30px] rounded-full transition-colors" />
        <span className="pointer-events-none absolute left-0.5 h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-3" />
      </span>
    </label>
  );
}

export function ProfileForm({ email, onSaved, initialValues }: ProfileFormProps) {
  const initialState: ProfileState = { error: null, success: false };
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const storedPronouns = initialValues.pronouns;
  const isPresetPronoun = PRONOUN_PRESETS.includes(storedPronouns);
  const [pronounChoice, setPronounChoice] = useState(
    storedPronouns === "" ? "" : isPresetPronoun ? storedPronouns : "custom",
  );
  const [customPronoun, setCustomPronoun] = useState(isPresetPronoun ? "" : storedPronouns);

  const [socialLinks, setSocialLinks] = useState<string[]>(() =>
    Array.from({ length: MAX_SOCIAL_LINKS }, (_, index) => initialValues.socialLinks[index] ?? ""),
  );
  const [prefersSolo, setPrefersSolo] = useState(initialValues.prefersSolo);
  const [profilePrivate, setProfilePrivate] = useState(initialValues.profilePrivate);

  function updateSocialLink(index: number, value: string) {
    setSocialLinks((current) => current.map((link, position) => (position === index ? value : link)));
  }

  const initials = initialsFrom(initialValues.fullName || initialValues.username);
  useEffect(() => {
    if (state.success) onSaved?.();
  }, [state.success, onSaved]);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError("Image must be under 4MB.");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/avatar/upload",
      });
      setImageUrl(blob.url);
      const result = await setAvatar(blob.url);
      if (result.error) {
        setUploadError(result.error);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-10">
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <section>
        <SectionHeading>Account</SectionHeading>
        <div className="space-y-5">
          <div className="flex items-start gap-5">
            <span className="border-app-border bg-app-surface text-app-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border text-lg font-semibold">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Profile picture" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  defaultValue={initialValues.fullName}
                  required
                  maxLength={120}
                  className={inputClass}
                  placeholder="Sahil Basumatary"
                />
              </Field>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-app-accent text-sm font-medium hover:underline disabled:opacity-55"
                >
                  {uploading ? "Uploading…" : "Change photo"}
                </button>
                <span className="text-app-muted-2 text-xs">JPG, PNG, WEBP or GIF · max 4MB</span>
              </div>
              {uploadError ? <p className="mt-1 text-xs text-[#b94a48]">{uploadError}</p> : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onFile}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Username" htmlFor="username">
              <input
                id="username"
                name="username"
                defaultValue={initialValues.username}
                maxLength={40}
                className={inputClass}
                placeholder="sahil"
              />
            </Field>
            <Field label="Email">
              <input
                value={email}
                disabled
                className={`${inputClass} bg-app-surface text-app-muted-2`}
              />
            </Field>
          </div>

          <Field label="Pronouns" htmlFor="pronounsSelect">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                id="pronounsSelect"
                name="pronounsSelect"
                value={pronounChoice}
                onChange={(event) => setPronounChoice(event.target.value)}
                className={`${inputClass} sm:max-w-[200px]`}
              >
                {PRONOUN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {pronounChoice === "custom" ? (
                <input
                  name="pronounsCustom"
                  value={customPronoun}
                  onChange={(event) => setCustomPronoun(event.target.value)}
                  maxLength={40}
                  className={inputClass}
                  placeholder="Add your pronouns"
                />
              ) : null}
            </div>
          </Field>

          <Field label="Bio" htmlFor="bio">
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialValues.bio}
              maxLength={400}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="What are you building and what kind of teammate are you looking for?"
            />
          </Field>
        </div>
      </section>

      <section>
        <SectionHeading>Links</SectionHeading>
        <div className="space-y-5">
          <Field
            label="GitHub username"
            hint="Paste a handle or full profile URL"
            htmlFor="githubUsername"
          >
            <input
              id="githubUsername"
              name="githubUsername"
              defaultValue={initialValues.githubUsername}
              maxLength={120}
              className={inputClass}
              placeholder="sahil-basumatary"
            />
          </Field>
          <ToggleRow
            name="showGithub"
            defaultChecked={initialValues.showGithub}
            label="Show GitHub on your public profile"
            hint="Appears on your partner card and dashboard."
          />

          <Field
            label="Social accounts"
          >
            <div className="space-y-2">
              {socialLinks.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="border-app-border text-app-muted-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border">
                    <SocialIcon url={iconPreview(value)} className="h-4 w-4" />
                  </span>
                  <input
                    name={`socialLink${index}`}
                    value={value}
                    onChange={(event) => updateSocialLink(index, event.target.value)}
                    maxLength={200}
                    className={inputClass}
                    placeholder="Link to social profile"
                  />
                </div>
              ))}
            </div>
          </Field>
        </div>
      </section>

      <section>
        <SectionHeading>Expertise</SectionHeading>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Skills" hint="Comma separated." htmlFor="skills">
              <input
                id="skills"
                name="skills"
                defaultValue={initialValues.skills}
                className={inputClass}
                placeholder="TypeScript, React, PostgreSQL"
              />
            </Field>
            <Field label="Interests" hint="Comma separated." htmlFor="interests">
              <input
                id="interests"
                name="interests"
                defaultValue={initialValues.interests}
                className={inputClass}
                placeholder="Fintech, Cybersecurity, AI"
              />
            </Field>
          </div>
          <Field label="Role">
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((role) => (
                <label key={role.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    defaultChecked={initialValues.role === role.value}
                    className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    required
                  />
                  <div className="border-app-border bg-app-canvas text-app-muted hover:border-app-border-strong peer-checked:border-app-accent peer-checked:text-app-fg rounded-md border px-4 py-2.5 text-center text-sm transition-colors peer-checked:font-medium">
                    {role.label}
                  </div>
                </label>
              ))}
            </div>
          </Field>
          <ToggleRow
            name="prefersSolo"
            checked={prefersSolo}
            onChange={setPrefersSolo}
            label="Focus on solo projects for now"
            hint="We'll tone down teammate suggestions."
          />
          <ToggleRow
            name="profilePrivate"
            checked={profilePrivate}
            onChange={setProfilePrivate}
            label="Hide profile from partner discovery"
            hint="You won't appear in Partners or teammate suggestions. Existing inbox threads stay visible to people you've already contacted."
          />
        </div>
      </section>

      <div className="border-app-border flex items-center gap-4 border-t pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="bg-app-accent text-app-accent-fg hover:bg-app-accent-hover inline-flex h-10 items-center rounded-md px-5 text-sm font-medium transition-colors disabled:opacity-55"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {state.error ? <span className="text-sm text-[#b94a48]">{state.error}</span> : null}
      </div>
    </form>
  );
}
