"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteProject,
  leaveProject,
  transferOwnership,
  updateProject,
  type LifecycleState,
} from "./actions";

type ProjectManagePanelProps = {
  projectId: string;
  isOwner: boolean;
  isCompleted: boolean;
  name: string;
  description: string;
  techStack: string[];
  estimatedTime: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  members: Array<{ userId: string; name: string; role: "OWNER" | "MEMBER" }>;
};

const initialState: LifecycleState = { error: null, success: false };

export function ProjectManagePanel({
  projectId,
  isOwner,
  isCompleted,
  name,
  description,
  techStack,
  estimatedTime,
  visibility,
  members,
}: ProjectManagePanelProps) {
  const [editState, editAction, editPending] = useActionState(updateProject, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProject, initialState);
  const [leaveState, leaveAction, leavePending] = useActionState(leaveProject, initialState);
  const [transferState, transferAction, transferPending] = useActionState(
    transferOwnership,
    initialState,
  );

  const transferable = members.filter((member) => member.role === "MEMBER");

  return (
    <section className="border-app-divider bg-app-paper border">
      <div className="border-app-divider border-b px-5 py-4">
        <p className="text-app-label text-[12px] font-semibold tracking-[0.3em] uppercase">
          Manage
        </p>
      </div>
      <div className="space-y-6 p-5">
        {isOwner && !isCompleted ? (
          <form action={editAction} className="grid gap-4">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="grid gap-2">
              <label htmlFor="edit-name" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                Project name
              </label>
              <input
                id="edit-name"
                name="name"
                defaultValue={name}
                maxLength={120}
                required
                className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-description" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                Brief
              </label>
              <textarea
                id="edit-description"
                name="description"
                defaultValue={description}
                rows={5}
                maxLength={1200}
                required
                className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink resize-none border px-3 py-3 text-sm leading-6 outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="edit-tech" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                  Tech stack
                </label>
                <input
                  id="edit-tech"
                  name="techStack"
                  defaultValue={techStack.join(", ")}
                  className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="edit-time" className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                  Estimated time
                </label>
                <input
                  id="edit-time"
                  name="estimatedTime"
                  defaultValue={estimatedTime ?? ""}
                  maxLength={80}
                  className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none"
                />
              </div>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
                Visibility
              </legend>
              <div className="flex gap-4">
                <label className="text-app-body flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    defaultChecked={visibility === "PUBLIC"}
                    className="accent-app-ink"
                  />
                  Public
                </label>
                <label className="text-app-body flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    defaultChecked={visibility === "PRIVATE"}
                    className="accent-app-ink"
                  />
                  Private
                </label>
              </div>
            </fieldset>
            {editState.error ? (
              <p role="alert" className="text-app-ink text-sm">
                {editState.error}
              </p>
            ) : null}
            {editState.success ? (
              <p role="status" className="text-app-label text-sm">
                Brief saved.
              </p>
            ) : null}
            <Button
              disabled={editPending}
              className="bg-app-ink text-app-paper hover:bg-app-accent-hover rounded-full px-6"
            >
              {editPending ? "Saving..." : "Save brief"}
            </Button>
          </form>
        ) : null}

        {isOwner && transferable.length ? (
          <form action={transferAction} className="border-app-divider grid gap-3 border-t pt-5">
            <input type="hidden" name="projectId" value={projectId} />
            <p className="text-app-label text-[11px] font-semibold tracking-[0.2em] uppercase">
              Transfer ownership
            </p>
            <select
              name="nextOwnerId"
              required
              className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink border px-3 py-3 text-sm outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Choose a member
              </option>
              {transferable.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
            {transferState.error ? (
              <p role="alert" className="text-app-ink text-sm">
                {transferState.error}
              </p>
            ) : null}
            <Button
              disabled={transferPending}
              variant="secondary"
              className="border-app-divider rounded-full border px-6"
            >
              {transferPending ? "Transferring..." : "Transfer ownership"}
            </Button>
          </form>
        ) : null}

        <div className="border-app-divider grid gap-3 border-t pt-5">
          <form action={leaveAction}>
            <input type="hidden" name="projectId" value={projectId} />
            {leaveState.error ? (
              <p role="alert" className="text-app-ink mb-2 text-sm">
                {leaveState.error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={leavePending}
              className="text-app-label hover:text-app-ink text-sm font-medium underline underline-offset-2 disabled:opacity-50"
            >
              {leavePending ? "Leaving..." : isOwner ? "Leave / delete solo project" : "Leave project"}
            </button>
          </form>

          {isOwner ? (
            <form action={deleteAction}>
              <input type="hidden" name="projectId" value={projectId} />
              {deleteState.error ? (
                <p role="alert" className="text-app-ink mb-2 text-sm">
                  {deleteState.error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={deletePending}
                className="text-app-signal text-sm font-medium underline underline-offset-2 disabled:opacity-50"
              >
                {deletePending ? "Deleting..." : "Delete project"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
