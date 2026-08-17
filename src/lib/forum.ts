export const FORUM_BOARDS = [
  {
    slug: "looking-for-partners",
    title: "Looking for partners",
    description: "Find teammates for active builds.",
    sortOrder: 0,
  },
  {
    slug: "open-builds",
    title: "Open builds",
    description: "Public briefs and open roles.",
    sortOrder: 1,
  },
  {
    slug: "tech",
    title: "Tech",
    description: "Engineering questions and decisions.",
    sortOrder: 2,
  },
  {
    slug: "proof",
    title: "Proof",
    description: "Published work and peer verification.",
    sortOrder: 3,
  },
  {
    slug: "general",
    title: "General",
    description: "Everything else about building at KCL.",
    sortOrder: 4,
  },
] as const;

export type ForumBoardSlug = (typeof FORUM_BOARDS)[number]["slug"];

export const THREAD_PAGE_SIZE = 40;
export const POST_PAGE_SIZE = 400;
export const TITLE_MIN = 8;
export const TITLE_MAX = 120;
export const BODY_MIN = 20;
export const BODY_MAX = 8000;
export const MAX_TAGS = 5;
export const TAG_MAX_LEN = 24;
export const THREADS_PER_HOUR = 5;
export const POSTS_PER_HOUR = 30;
export const POSTS_BURST = 8;
export const BURST_WINDOW_MS = 10 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const VOTES_BURST = 40;
export const MAX_REPLY_DEPTH = 8;
export const HOT_POOL = 200;

const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/;
const BOARD_SLUGS = new Set<string>(FORUM_BOARDS.map((board) => board.slug));

export function isForumBoardSlug(value: string): value is ForumBoardSlug {
  return BOARD_SLUGS.has(value);
}

export function forumThreadPath(boardSlug: string, threadId: string) {
  return `/forum/${boardSlug}/${threadId}`;
}

export function parseForumTitle(raw: string | null): { value: string } | { error: string } {
  const value = (raw ?? "").trim().replace(/\s+/g, " ");
  if (value.length < TITLE_MIN) {
    return { error: `Title needs at least ${TITLE_MIN} characters.` };
  }
  if (value.length > TITLE_MAX) {
    return { error: `Title must be ${TITLE_MAX} characters or fewer.` };
  }
  return { value };
}

export function parseForumBody(raw: string | null): { value: string } | { error: string } {
  const value = (raw ?? "").trim();
  if (value.length < BODY_MIN) {
    return { error: `Post must be at least ${BODY_MIN} characters.` };
  }
  if (value.length > BODY_MAX) {
    return { error: `Post must be ${BODY_MAX} characters or fewer.` };
  }
  return { value };
}

export function parseForumTags(raw: string | null): { value: string[] } | { error: string } {
  if (!raw || !raw.trim()) return { value: [] };
  const seen = new Set<string>();
  const value: string[] = [];
  for (const part of raw.split(/[,]+/)) {
    const tag = part.trim().toLowerCase();
    if (!tag) continue;
    if (tag.length > TAG_MAX_LEN || !TAG_PATTERN.test(tag)) {
      return { error: "Tags use lowercase letters, numbers, and hyphens (max 24 chars)." };
    }
    if (seen.has(tag)) continue;
    seen.add(tag);
    value.push(tag);
    if (value.length > MAX_TAGS) {
      return { error: `Use at most ${MAX_TAGS} tags.` };
    }
  }
  return { value };
}

export type LinkSegment = { type: "text" | "link"; value: string };

export function splitLinkified(text: string): LinkSegment[] {
  const parts: LinkSegment[] = [];
  const re = /https:\/\/[^\s<>"'`]+/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const full = match[0];
    const url = full.replace(/[),.;!?]+$/g, "");
    if (match.index > last) {
      parts.push({ type: "text", value: text.slice(last, match.index) });
    }
    if (url.startsWith("https://") && url.length <= 2048) {
      parts.push({ type: "link", value: url });
      if (url.length < full.length) {
        parts.push({ type: "text", value: full.slice(url.length) });
      }
    } else {
      parts.push({ type: "text", value: full });
    }
    last = match.index + full.length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}

export function formatForumTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

export type ForumSort = "hot" | "last" | "new" | "replies" | "views";

export function parseForumSort(raw: string | undefined): ForumSort {
  if (raw === "last" || raw === "new" || raw === "replies" || raw === "views") return raw;
  return "hot";
}

export function forumThreadOrder(sort: ForumSort) {
  if (sort === "new") return [{ createdAt: "desc" as const }, { id: "desc" as const }];
  if (sort === "replies")
    return [{ replyCount: "desc" as const }, { lastPostedAt: "desc" as const }];
  if (sort === "views") return [{ viewCount: "desc" as const }, { lastPostedAt: "desc" as const }];
  return [{ lastPostedAt: "desc" as const }, { id: "desc" as const }];
}

export function threadHotScore(score: number, lastPostedAt: Date): number {
  const hours = Math.max(0, (Date.now() - lastPostedAt.getTime()) / 3_600_000);
  return (Math.max(score, 0) + 1) / Math.pow(hours + 2, 1.4);
}

export function profileHref(user: {
  username: string | null;
  profilePrivate: boolean;
}): string | null {
  if (user.profilePrivate || !user.username) return null;
  return `/u/${user.username}`;
}

export const authorSelect = {
  id: true,
  fullName: true,
  username: true,
  imageUrl: true,
  role: true,
  profilePrivate: true,
  skills: true,
  interests: true,
} as const;

export type ForumAuthor = {
  id: string;
  fullName: string | null;
  username: string | null;
  imageUrl: string | null;
  role: import("@prisma/client").UserRole | null;
  profilePrivate: boolean;
  skills: string[];
  interests: string[];
};

export type ThreadListItem = {
  id: string;
  title: string;
  tags: string[];
  replyCount: number;
  viewCount: number;
  score: number;
  lastPostedAt: Date;
  createdAt: Date;
  locked: boolean;
  openingPostId: string;
  lastPostId: string | null;
  authorPostCount: number;
  voted: boolean;
  board: { slug: string; title: string };
  author: ForumAuthor;
  lastPostAuthor: Pick<ForumAuthor, "fullName" | "username" | "profilePrivate"> | null;
};

export const threadListSelect = {
  id: true,
  title: true,
  tags: true,
  replyCount: true,
  viewCount: true,
  score: true,
  lastPostedAt: true,
  createdAt: true,
  locked: true,
  lastPostId: true,
  board: { select: { slug: true, title: true } },
  author: { select: authorSelect },
  lastPostAuthor: {
    select: { fullName: true, username: true, profilePrivate: true },
  },
  posts: {
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: { id: true },
  },
} as const;

export function toThreadListItem(
  row: {
    id: string;
    title: string;
    tags: string[];
    replyCount: number;
    viewCount: number;
    score: number;
    lastPostedAt: Date;
    createdAt: Date;
    locked: boolean;
    lastPostId: string | null;
    board: { slug: string; title: string };
    author: ForumAuthor;
    lastPostAuthor: Pick<ForumAuthor, "fullName" | "username" | "profilePrivate"> | null;
    posts: { id: string }[];
  },
  authorPostCount: number,
  voted: boolean,
): ThreadListItem {
  return {
    id: row.id,
    title: row.title,
    tags: row.tags,
    replyCount: row.replyCount,
    viewCount: row.viewCount,
    score: row.score,
    lastPostedAt: row.lastPostedAt,
    createdAt: row.createdAt,
    locked: row.locked,
    openingPostId: row.posts[0]?.id ?? row.id,
    lastPostId: row.lastPostId,
    authorPostCount,
    voted,
    board: row.board,
    author: row.author,
    lastPostAuthor: row.lastPostAuthor,
  };
}

export type FlatForumPost = {
  id: string;
  parentId: string | null;
  body: string;
  score: number;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  authorId: string;
  author: ForumAuthor;
  voted: boolean;
};

export type CommentNode = {
  post: FlatForumPost;
  number: number;
  depth: number;
  children: CommentNode[];
};

export function buildCommentTree(posts: FlatForumPost[]): {
  opening: FlatForumPost | null;
  roots: CommentNode[];
} {
  if (!posts.length) return { opening: null, roots: [] };
  const ordered = [...posts].sort((a, b) => {
    const delta = a.createdAt.getTime() - b.createdAt.getTime();
    return delta !== 0 ? delta : a.id.localeCompare(b.id);
  });
  const opening = ordered[0];
  const replies = ordered.slice(1);
  const ids = new Set(ordered.map((post) => post.id));
  const grouped = new Map<string, FlatForumPost[]>();
  const roots: FlatForumPost[] = [];
  for (const post of replies) {
    const parentId =
      post.parentId && post.parentId !== opening.id && ids.has(post.parentId)
        ? post.parentId
        : null;
    if (parentId) {
      const list = grouped.get(parentId) ?? [];
      list.push(post);
      grouped.set(parentId, list);
    } else {
      roots.push(post);
    }
  }
  const numbers = new Map(replies.map((post, index) => [post.id, index + 1]));
  function toNode(post: FlatForumPost, depth: number): CommentNode {
    return {
      post,
      number: numbers.get(post.id) ?? 0,
      depth,
      children: (grouped.get(post.id) ?? []).map((child) =>
        toNode(child, Math.min(depth + 1, MAX_REPLY_DEPTH)),
      ),
    };
  }
  return { opening, roots: roots.map((post) => toNode(post, 0)) };
}
