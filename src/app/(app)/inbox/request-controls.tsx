"use client";

import { useActionState, useState } from "react";
import { AppButton } from "@/components/ui/app-button";
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
        <AppButton
          type="submit"
          name="decision"
          value="accept"
          disabled={isPending}
          onClick={() => setPendingDecision("accept")}
        >
          {isPending && pendingDecision === "accept" ? "Accepting..." : "Accept"}
        </AppButton>
        <AppButton
          type="submit"
          name="decision"
          value="decline"
          disabled={isPending}
          onClick={() => setPendingDecision("decline")}
          variant="secondary"
        >
          {isPending && pendingDecision === "decline" ? "Declining..." : "Decline"}
        </AppButton>
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
        <AppButton type="submit" disabled={isPending} variant="secondary">
          {isPending ? "Cancelling..." : "Cancel request"}
        </AppButton>
      </form>
      {state.error ? <p className="text-app-signal text-sm">{state.error}</p> : null}
    </div>
  );
}
