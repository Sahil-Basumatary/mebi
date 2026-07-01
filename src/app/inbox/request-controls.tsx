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
          className="inline-flex h-9 items-center rounded-full bg-[#000000] px-5 text-sm font-medium text-[#ffffff] transition-colors hover:bg-[#333333] disabled:opacity-50"
        >
          {isPending && pendingDecision === "accept" ? "Accepting..." : "Accept"}
        </button>
        <button
          type="submit"
          name="decision"
          value="decline"
          disabled={isPending}
          onClick={() => setPendingDecision("decline")}
          className="inline-flex h-9 items-center rounded-full border border-[#d8d8d8] px-5 text-sm font-medium text-[#555555] transition-colors hover:border-[#000000] hover:text-[#000000] disabled:opacity-50"
        >
          {isPending && pendingDecision === "decline" ? "Declining..." : "Decline"}
        </button>
      </form>
      {state.error ? <p className="text-sm text-[#b00020]">{state.error}</p> : null}
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
          className="inline-flex h-9 items-center rounded-full border border-[#d8d8d8] px-5 text-sm font-medium text-[#555555] transition-colors hover:border-[#000000] hover:text-[#000000] disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Cancel request"}
        </button>
      </form>
      {state.error ? <p className="text-sm text-[#b00020]">{state.error}</p> : null}
    </div>
  );
}
