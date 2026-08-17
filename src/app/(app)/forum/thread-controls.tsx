"use client";

import { ChevronUp } from "lucide-react";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import {
  deletePost,
  editPost,
  recordThreadView,
  replyToThread,
  togglePostVote,
  toggleThreadLock,
  type ForumFormState,
} from "@/app/(app)/forum/actions";
import { BODY_MAX } from "@/lib/forum";
import { cn } from "@/lib/utils";

const emptyState: ForumFormState = { error: null };

export function RecordThreadView({ threadId }: { threadId: string }) {
  useEffect(() => {
    const key = `forum-view:${threadId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    void recordThreadView(threadId);
  }, [threadId]);
  return null;
}

export function VoteControl({
  postId,
  score,
  voted,
  disabled,
  variant = "stack",
}: {
  postId: string;
  score: number;
  voted: boolean;
  disabled: boolean;
  variant?: "stack" | "box";
}) {
  if (variant === "box") {
    return (
      <form action={togglePostVote}>
        <input type="hidden" name="postId" value={postId} />
        <button
          type="submit"
          disabled={disabled}
          aria-pressed={voted}
          aria-label={voted ? "Remove upvote" : "Upvote"}
          className={cn(
            "flex h-10 w-10 items-center justify-center border text-sm font-semibold tabular-nums disabled:opacity-40",
            voted
              ? "border-forum-red bg-forum-red text-white"
              : "border-forum-blue text-forum-blue bg-app-paper hover:bg-app-wash border-dashed",
          )}
        >
          {score}
        </button>
      </form>
    );
  }
  return (
    <form action={togglePostVote} className="flex flex-col items-center gap-1">
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        disabled={disabled}
        aria-pressed={voted}
        aria-label={voted ? "Remove upvote" : "Upvote"}
        className={cn(
          "border-app-divider flex h-8 w-8 items-center justify-center border transition-colors disabled:opacity-40",
          voted
            ? "border-forum-red bg-forum-red text-white"
            : "bg-app-paper text-forum-blue hover:border-forum-blue",
        )}
      >
        <ChevronUp size={16} strokeWidth={2.25} aria-hidden />
      </button>
      <span className="text-app-ink font-mono text-sm tabular-nums">{score}</span>
    </form>
  );
}

export function LockThreadButton({ threadId, locked }: { threadId: string; locked: boolean }) {
  return (
    <form action={toggleThreadLock}>
      <input type="hidden" name="threadId" value={threadId} />
      <button
        type="submit"
        className="text-app-label hover:text-app-ink text-sm font-medium underline underline-offset-2"
      >
        {locked ? "Unlock thread" : "Lock thread"}
      </button>
    </form>
  );
}

export function DeletePostButton({ postId, isOpening }: { postId: string; isOpening: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-app-label hover:text-app-ink text-xs font-medium underline underline-offset-2"
      >
        Delete
      </button>
    );
  }
  return (
    <form action={deletePost} className="flex items-center gap-2">
      <input type="hidden" name="postId" value={postId} />
      <span className="text-app-body text-xs">
        {isOpening ? "Delete this thread?" : "Delete this post?"}
      </span>
      <button
        type="submit"
        className="text-app-ink text-xs font-medium underline underline-offset-2"
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-app-meta text-xs underline underline-offset-2"
      >
        Cancel
      </button>
    </form>
  );
}

export function EditPostForm({
  postId,
  initialBody,
  onClose,
}: {
  postId: string;
  initialBody: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(editPost, emptyState);

  useEffect(() => {
    if (state.doneAt) onClose();
  }, [state.doneAt, onClose]);

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        required
        minLength={20}
        maxLength={BODY_MAX}
        rows={6}
        defaultValue={initialBody}
        disabled={isPending}
        className="border-app-divider bg-app-wash text-app-ink focus:border-app-ink w-full resize-y border px-3 py-3 text-sm leading-6 outline-none"
      />
      {state.error ? (
        <p role="alert" className="text-app-ink mt-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-app-ink text-app-paper inline-flex h-8 items-center rounded-full px-4 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-app-label text-sm font-medium underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function OwnedPost({
  postId,
  body,
  isOpening,
  children,
}: {
  postId: string;
  body: string;
  isOpening: boolean;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return <EditPostForm postId={postId} initialBody={body} onClose={() => setEditing(false)} />;
  }
  return (
    <>
      {children}
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-app-label hover:text-app-ink text-xs font-medium underline underline-offset-2"
        >
          Edit
        </button>
        <DeletePostButton postId={postId} isOpening={isOpening} />
      </div>
    </>
  );
}

export function ReplyForm({
  threadId,
  parentPostId,
  compact = false,
  onCancel,
}: {
  threadId: string;
  parentPostId?: string;
  compact?: boolean;
  onCancel?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(replyToThread, emptyState);

  return (
    <form
      key={state.doneAt ?? 0}
      action={formAction}
      className={cn("border-app-divider bg-app-paper border", compact ? "p-3" : "p-4")}
    >
      <input type="hidden" name="threadId" value={threadId} />
      {parentPostId ? <input type="hidden" name="parentPostId" value={parentPostId} /> : null}
      <ReplyFields
        isPending={isPending}
        error={state.error}
        compact={compact}
        onCancel={onCancel}
      />
    </form>
  );
}

function ReplyFields({
  isPending,
  error,
  compact,
  onCancel,
}: {
  isPending: boolean;
  error: string | null;
  compact?: boolean;
  onCancel?: () => void;
}) {
  const [bodyLen, setBodyLen] = useState(0);

  return (
    <>
      {compact ? null : (
        <label
          htmlFor="forum-reply"
          className="text-app-label text-[13px] font-semibold tracking-[0.12em] uppercase"
        >
          Reply
        </label>
      )}
      <textarea
        id={compact ? undefined : "forum-reply"}
        name="body"
        required
        minLength={20}
        maxLength={BODY_MAX}
        rows={compact ? 4 : 5}
        disabled={isPending}
        onChange={(event) => setBodyLen(event.target.value.length)}
        placeholder="Write a reply"
        className="border-app-divider bg-app-wash text-app-ink placeholder:text-app-muted focus:border-app-ink mt-2 w-full resize-y border px-3 py-2 text-base leading-7 outline-none"
      />
      <p className="text-app-meta tracking-meta mt-1 font-mono text-xs">
        {bodyLen}/{BODY_MAX}
      </p>
      {error ? (
        <p role="alert" className="text-app-ink mt-2 text-sm">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-app-label text-sm font-medium underline underline-offset-2"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="bg-forum-red inline-flex h-9 items-center px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Posting..." : "Post reply"}
        </button>
      </div>
    </>
  );
}
