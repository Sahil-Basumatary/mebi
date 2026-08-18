-- CreateEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FORUM_REPLY';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "href" TEXT;

-- CreateTable
CREATE TABLE "ForumBoard" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumThread" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPostAuthorId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPostVote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumPostVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForumBoard_slug_key" ON "ForumBoard"("slug");

-- CreateIndex
CREATE INDEX "ForumThread_boardId_lastPostedAt_idx" ON "ForumThread"("boardId", "lastPostedAt");

-- CreateIndex
CREATE INDEX "ForumThread_boardId_createdAt_idx" ON "ForumThread"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_createdAt_idx" ON "ForumThread"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumThread_deletedAt_lastPostedAt_idx" ON "ForumThread"("deletedAt", "lastPostedAt");

-- CreateIndex
CREATE INDEX "ForumThread_projectId_idx" ON "ForumThread"("projectId");

-- CreateIndex
CREATE INDEX "ForumPost_threadId_createdAt_idx" ON "ForumPost"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumPostVote_postId_userId_key" ON "ForumPostVote"("postId", "userId");

-- CreateIndex
CREATE INDEX "ForumPostVote_userId_idx" ON "ForumPostVote"("userId");

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "ForumBoard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_lastPostAuthorId_fkey" FOREIGN KEY ("lastPostAuthorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostVote" ADD CONSTRAINT "ForumPostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostVote" ADD CONSTRAINT "ForumPostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ForumBoard" ("id", "slug", "title", "description", "sortOrder") VALUES
('cforumboardlft00000000001', 'looking-for-partners', 'Looking for partners', 'LFT / LFM. Say the brief, the stack, and what you need from a teammate.', 0),
('cforumboardopen0000000001', 'open-builds', 'Open builds', 'Talk about public briefs — join questions, stack choices, and scope.', 1),
('cforumboardtech0000000001', 'tech', 'Tech', 'Languages, tools, and how you actually ship at KCL.', 2),
('cforumboardproof000000001', 'proof', 'Proof', 'Attestations, publishing, and what belongs on a public ship.', 3),
('cforumboardgen00000000001', 'general', 'General', 'Campus, process, and everything else that still stays about building.', 4)
ON CONFLICT ("slug") DO NOTHING;
