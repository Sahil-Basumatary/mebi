"use client";

import { useActionState, useState } from "react";
import { cancelRequest, respondToRequest, type RespondState } from "./actions";

const initialState: RespondState = {
  error: null,
};

export function RequestResponse({ requestId }: { requestId: string }) {
  const [state, formAction, isPending] = useActionState(respondToRequest, initialState);
  const [pendingDecision, setPendingDecision] = useState<"accept" | "decline" | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="requestId" value={requestId} />
        <button
          type="submit"
          name="decision"
          value="accept"
          disabled={isPending}
          onClick={() => setPendingDecision("accept")}
          className="bg-app-ink text-app-paper hover:bg-app-accent-hover inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending && pendingDecision === "accept" ? "Accepting..." : "Accept"}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          disabled={isPending}
          onClick={() => setPendingDecision("decline")}
          className="border-app-divider text-app-label hover:border-app-ink hover:text-app-ink inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending && pendingDecision === "decline" ? "Declining..." : "Decline"}
        </button>
      </form>
      {state.error ? <p className="text-app-signal text-sm">{state.error}</p> : null}
    </div>
  );
}

export function CancelRequest({ requestId }: { requestId: string }) {
  const [state, formAction, isPending] = useActionState(cancelRequest, initialState);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={formAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <button
          type="submit"
          disabled={isPending}
          className="border-app-divider text-app-label hover:border-app-ink hover:text-app-ink inline-flex h-9 items-center rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Cancel request"}
        </button>
      </form>
      {state.error ? <p className="text-app-signal text-sm">{state.error}</p> : null}
    </div>
  );
}
