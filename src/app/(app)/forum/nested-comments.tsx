"use client";

import Link from "next/link";
import { useState } from "react";
import { PartnerRequestDialog } from "@/app/(app)/partners/partner-request-dialog";
import { formatForumTime, profileHref, type CommentNode, type FlatForumPost } from "@/lib/forum";
import { displayName, ROLE_LABEL } from "@/lib/user-display";
import { PostBody } from "./post-body";
import { OwnedPost, ReplyForm, VoteControl } from "./thread-controls";

type InviteContext = {
  viewerId: string;
  viewerPrivate: boolean;
  viewerSkills: string[];
  viewerInterests: string[];
  projects: { id: string; name: string }[];
  enabled: boolean;
};

export function NestedComments({
  threadId,
  locked,
  viewerId,
  roots,
  invite,
}: {
  threadId: string;
  locked: boolean;
  viewerId: string;
  roots: CommentNode[];
  invite: InviteContext;
}) {
  return (
    <div className="flex flex-col gap-3">
      {roots.map((node) => (
        <CommentBranch
          key={node.post.id}
          threadId={threadId}
          locked={locked}
          viewerId={viewerId}
          node={node}
          invite={invite}
        />
      ))}
    </div>
  );
}

function CommentBranch({
  threadId,
  locked,
  viewerId,
  node,
  invite,
}: {
  threadId: string;
  locked: boolean;
  viewerId: string;
  node: CommentNode;
  invite: InviteContext;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const hidden = countDescendants(node);

  return (
    <div style={{ marginLeft: node.depth * 18 }} className="min-w-0">
      <article id={node.post.id} className="border-app-divider bg-app-paper border shadow-sm">
        <header className="bg-app-chip flex items-center justify-between gap-3 px-2 py-1">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              className="text-app-label hover:text-app-ink font-mono text-xs"
            >
              [{collapsed ? "+" : "–"}]
            </button>
            <span className="text-app-ink font-mono text-sm font-semibold">#{node.number}</span>
            {collapsed ? (
              <span className="text-app-meta truncate text-xs">{hidden} hidden</span>
            ) : null}
          </div>
          <CommentAuthor post={node.post} />
        </header>
        {collapsed ? null : (
          <>
            <div className="px-3 py-2">
              <CommentBody post={node.post} viewerId={viewerId} locked={locked} isOpening={false} />
            </div>
            <footer className="text-app-meta flex flex-wrap items-center justify-between gap-2 px-3 pb-2 text-[13px]">
              <span>{formatForumTime(node.post.createdAt)}</span>
              <div className="flex items-center gap-3">
                {node.post.deletedAt ? null : (
                  <VoteControl
                    postId={node.post.id}
                    score={node.post.score}
                    voted={node.post.voted}
                    disabled={node.post.authorId === viewerId}
                    variant="box"
                  />
                )}
                {!locked && !node.post.deletedAt ? (
                  <button
                    type="button"
                    onClick={() => setReplying((value) => !value)}
                    className="text-app-ink font-semibold underline underline-offset-2"
                  >
                    Reply
                  </button>
                ) : null}
              </div>
            </footer>
            <CommentInvite post={node.post} invite={invite} viewerId={viewerId} />
            {replying && !locked ? (
              <div className="px-3 pb-3">
                <ReplyForm
                  threadId={threadId}
                  parentPostId={node.post.id}
                  compact
                  onCancel={() => setReplying(false)}
                />
              </div>
            ) : null}
          </>
        )}
      </article>
      {collapsed
        ? null
        : node.children.map((child) => (
            <div key={child.post.id} className="mt-3">
              <CommentBranch
                threadId={threadId}
                locked={locked}
                viewerId={viewerId}
                node={child}
                invite={invite}
              />
            </div>
          ))}
    </div>
  );
}

function countDescendants(node: CommentNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

function CommentAuthor({ post }: { post: FlatForumPost }) {
  const name = displayName(post.author.fullName, post.author.username);
  const href = profileHref(post.author);
  const inner = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="text-forum-blue truncate text-[15px] font-semibold">{name}</span>
      {post.author.role ? (
        <span className="text-app-meta text-[11px] font-semibold tracking-[0.08em] uppercase">
          {ROLE_LABEL[post.author.role]}
        </span>
      ) : null}
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="min-w-0 hover:underline">
      {inner}
    </Link>
  );
}

function CommentBody({
  post,
  viewerId,
  locked,
  isOpening,
}: {
  post: FlatForumPost;
  viewerId: string;
  locked: boolean;
  isOpening: boolean;
}) {
  if (post.deletedAt) {
    return <p className="text-app-meta text-sm italic">This post was removed.</p>;
  }
  const body = (
    <>
      <PostBody body={post.body} />
      {post.editedAt ? (
        <p className="text-app-meta tracking-meta mt-2 font-mono text-[11px] uppercase">
          Edited {formatForumTime(post.editedAt)}
        </p>
      ) : null}
    </>
  );
  if (viewerId === post.authorId && !locked) {
    return (
      <OwnedPost postId={post.id} body={post.body} isOpening={isOpening}>
        {body}
      </OwnedPost>
    );
  }
  return body;
}

function CommentInvite({
  post,
  invite,
  viewerId,
}: {
  post: FlatForumPost;
  invite: InviteContext;
  viewerId: string;
}) {
  if (
    !invite.enabled ||
    post.deletedAt ||
    post.authorId === viewerId ||
    post.author.profilePrivate ||
    invite.viewerPrivate ||
    !invite.projects.length
  ) {
    return null;
  }
  return (
    <div className="px-3 pb-3">
      <PartnerRequestDialog
        toUserId={post.author.id}
        toName={displayName(post.author.fullName, post.author.username)}
        sharedSkills={intersect(invite.viewerSkills, post.author.skills)}
        sharedInterests={intersect(invite.viewerInterests, post.author.interests)}
        projects={invite.projects}
      />
    </div>
  );
}

function intersect(left: string[], right: string[]): string[] {
  const lookup = new Set(right.map((tag) => tag.toLowerCase()));
  return left.filter((tag) => lookup.has(tag.toLowerCase()));
}

export function OpeningPost({
  post,
  threadId,
  locked,
  viewerId,
  invite,
}: {
  post: FlatForumPost;
  threadId: string;
  locked: boolean;
  viewerId: string;
  invite: InviteContext;
}) {
  const [replying, setReplying] = useState(false);
  return (
    <article id={post.id} className="border-app-divider bg-app-paper border shadow-sm">
      <div className="flex gap-3 p-3 sm:p-4">
        {post.deletedAt ? null : (
          <VoteControl
            postId={post.id}
            score={post.score}
            voted={post.voted}
            disabled={post.authorId === viewerId}
          />
        )}
        <div className="min-w-0 flex-1">
          <CommentAuthor post={post} />
          <div className="mt-2">
            <CommentBody post={post} viewerId={viewerId} locked={locked} isOpening />
          </div>
          <p className="text-app-meta mt-3 text-[13px]">{formatForumTime(post.createdAt)}</p>
          <CommentInvite post={post} invite={invite} viewerId={viewerId} />
          {!locked && !post.deletedAt ? (
            <button
              type="button"
              onClick={() => setReplying((value) => !value)}
              className="text-app-ink mt-2 text-sm font-semibold underline underline-offset-2"
            >
              Reply
            </button>
          ) : null}
        </div>
      </div>
      {replying && !locked ? (
        <div className="px-3 pb-3">
          <ReplyForm
            threadId={threadId}
            parentPostId={post.id}
            compact
            onCancel={() => setReplying(false)}
          />
        </div>
      ) : null}
    </article>
  );
}
