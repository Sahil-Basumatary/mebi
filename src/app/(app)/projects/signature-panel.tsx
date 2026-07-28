"use client";

import { useActionState } from "react";
import {
  revokeProofSignature,
  signProofContribution,
  type SignatureState,
} from "./actions";

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
      <label className="text-app-body flex items-start gap-2 text-body-sm leading-5">
        <input
          type="checkbox"
          name="consent"
          value="true"
          required
          className="accent-app-ink mt-1"
        />
        <span>
          I confirm {name} contributed real work. Signing is also my consent for their name to
          appear on a published proof of this build.
        </span>
      </label>
      {state.error ? <p className="text-app-ink text-sm">{state.error}</p> : null}
      {state.success ? (
        <p className="text-app-label text-sm font-medium">Signed.</p>
      ) : (
        <button
          type="submit"
          disabled={isPending}
          className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Signing..." : `Sign for ${name}`}
        </button>
      )}
    </form>
  );
}

function RevokeForm({ signatureId }: { signatureId: string }) {
  const [state, formAction, isPending] = useActionState(revokeProofSignature, initialState);

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="signatureId" value={signatureId} />
      {state.error ? <p className="text-app-ink mb-2 text-sm">{state.error}</p> : null}
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
        <p className="text-app-body mt-3 text-body-sm leading-6">
          Peer signatures need at least two people on the roster. Invite a partner, then sign each
          other after real build-log posts.
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
        <p className="text-app-body mt-2 text-body-sm leading-5">
          {verified
            ? "Every member has a non-revoked signature from a teammate."
            : `${signaturesReceived} of ${memberCount} members attested.`}
        </p>
      </div>
      <ul className="divide-app-divider divide-y">
        {teammates.map((teammate) => (
          <li key={teammate.id} className="px-5 py-4">
            <p className="text-app-ink text-sm font-medium">{teammate.name}</p>
            {teammate.alreadySigned && teammate.signatureId ? (
              <>
                <p className="text-app-label mt-1 font-mono text-chip tracking-meta uppercase">
                  You signed them
                </p>
                <RevokeForm signatureId={teammate.signatureId} />
              </>
            ) : teammate.canSign ? (
              <SignForm projectId={projectId} subjectId={teammate.id} name={teammate.name} />
            ) : (
              <p className="text-app-meta mt-2 text-body-sm leading-5">
                {teammate.reason ?? "Not ready to sign."}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
