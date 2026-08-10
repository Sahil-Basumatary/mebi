"use client";

import { useActionState } from "react";
import { removeMember, type LifecycleState } from "./actions";

type RosterActionsProps = {
  projectId: string;
  memberUserId: string;
  memberName: string;
};

const initialState: LifecycleState = { error: null, success: false };

export function RemoveMemberButton({ projectId, memberUserId, memberName }: RosterActionsProps) {
  const [state, formAction, isPending] = useActionState(removeMember, initialState);

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="memberUserId" value={memberUserId} />
      {state.error ? (
        <p role="alert" className="text-app-ink mb-1 text-xs">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="text-app-label hover:text-app-ink text-xs font-medium underline underline-offset-2 disabled:opacity-50"
      >
        {isPending ? "Removing..." : `Remove ${memberName.split(" ")[0]}`}
      </button>
    </form>
  );
}
