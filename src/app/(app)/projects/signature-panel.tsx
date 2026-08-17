"use client";

import { useActionState } from "react";
import { AppButton } from "@/components/ui/app-button";
import { revokeProofSignature, signProofContribution, type SignatureState } from "./actions";

type Teammate = {
  id: string;
  name: string;
  canSign: boolean;
  alreadySigned: boolean;
  signatureId: string | null;
  reason?: string;
};

type SignaturePanelProps = {
  projectId: string;
  verified: boolean;
  teammates: Teammate[];
  signaturesReceived: number;
  memberCount: number;
};

const initialState: SignatureState = {
  error: null,
  success: false,
};

function SignForm({
  projectId,
  subjectId,
  name,
}: {
  projectId: string;
  subjectId: string;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState(signProofContribution, initialState);

  return (
    <form action={formAction} className="border-app-divider mt-3 space-y-3 border-t pt-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="subjectId" value={subjectId} />
      <div className="grid gap-2">
        <label
          htmlFor={`statement-${subjectId}`}
          className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase"
        >
          What did they contribute?
        </label>
        <textarea
          id={`statement-${subjectId}`}
          name="statement"
          rows={3}
          minLength={40}
          maxLength={280}
          required
          placeholder={`${name} built the matching query and reviewed the brief with me...`}
          className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink resize-none border px-3 py-3 text-sm leading-5 outline-none"
        />
      </div>
      <label className="text-app-body text-body-sm flex items-start gap-2 leading-5">
        <input
          type="checkbox"
          name="consent"
          value="true"
          required
          className="accent-app-ink mt-1"
        />
        <span>
          I confirm this attestation is accurate. Signing is also my consent for their name to
          appear on a published proof of this build.
        </span>
      </label>
      {state.error ? (
        <p role="alert" className="text-app-ink text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-app-label text-sm font-medium">
          Signed.
        </p>
      ) : (
        <AppButton type="submit" disabled={isPending} size="sm">
          {isPending ? "Signing..." : `Sign for ${name}`}
        </AppButton>
      )}
    </form>
  );
}

function RevokeForm({ signatureId }: { signatureId: string }) {
  const [state, formAction, isPending] = useActionState(revokeProofSignature, initialState);

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="signatureId" value={signatureId} />
      {state.error ? (
        <p role="alert" className="text-app-ink mb-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="text-app-label hover:text-app-ink text-xs font-medium underline underline-offset-2 disabled:opacity-50"
      >
        {isPending ? "Revoking..." : "Revoke signature"}
      </button>
    </form>
  );
}

export function SignaturePanel({
  projectId,
  verified,
  teammates,
  signaturesReceived,
  memberCount,
}: SignaturePanelProps) {
  if (memberCount < 2) {
    return (
      <section className="border-app-divider bg-app-paper border p-5">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Verification
        </p>
        <p className="text-app-body text-body-sm mt-3 leading-6">
          Peer signatures need at least two people on the roster. Invite a partner, then sign each
          other after sustained build-log work.
        </p>
      </section>
    );
  }

  return (
    <section className="border-app-divider bg-app-paper border">
      <div className="border-app-divider border-b px-5 py-4">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Verification
        </p>
        <p className="text-app-ink mt-2 font-serif text-2xl font-light">
          {verified ? "Verified build" : "Awaiting peer signatures"}
        </p>
        <p className="text-app-body text-body-sm mt-2 leading-5">
          {verified
            ? "Every member has a non-revoked signature from a teammate."
            : `${signaturesReceived} of ${memberCount} members attested. Signatures require two days of substantive posts.`}
        </p>
      </div>
      <ul className="divide-app-divider divide-y">
        {teammates.map((teammate) => (
          <li key={teammate.id} className="px-5 py-4">
            <p className="text-app-ink text-sm font-medium">{teammate.name}</p>
            {teammate.alreadySigned && teammate.signatureId ? (
              <>
                <p className="text-app-label text-chip tracking-meta mt-1 font-mono uppercase">
                  You signed them
                </p>
                <RevokeForm signatureId={teammate.signatureId} />
              </>
            ) : teammate.canSign ? (
              <SignForm projectId={projectId} subjectId={teammate.id} name={teammate.name} />
            ) : (
              <p className="text-app-meta text-body-sm mt-2 leading-5">
                {teammate.reason ?? "Not ready to sign."}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
