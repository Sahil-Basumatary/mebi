-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "AiCapability" AS ENUM ('BACKGROUND', 'FREE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AiActionKind" AS ENUM ('ARCHITECTURE', 'COMMIT_REVIEW', 'HINT', 'DOCS', 'BACKGROUND_INDEX');

-- CreateEnum
CREATE TYPE "AiUsageStatus" AS ENUM ('RESERVED', 'SETTLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AiDocumentKind" AS ENUM ('README', 'ADR', 'ARCHITECTURE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS "foundingOffer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "planGrantedUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "aiConsentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "aiDisabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "mailedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppFlag" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AiUsagePeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsReserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiUsagePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "capability" "AiCapability" NOT NULL,
    "action" "AiActionKind" NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" "AiUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "model" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubInstallation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GithubInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubInstallNonce" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GithubInstallNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubWebhookDelivery" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GithubWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubRepository" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "projectId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastIndexedSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GithubRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoArchitecture" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "languages" JSONB NOT NULL,
    "dependencies" JSONB NOT NULL,
    "modules" JSONB NOT NULL,
    "sourceSha" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepoArchitecture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoFileIndex" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "language" TEXT,
    "bytes" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepoFileIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepoCommitReview" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepoCommitReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMistake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningMistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiHintSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "ladderStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiHintSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDocumentDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "kind" "AiDocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiDocumentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_ipHash_createdAt_idx" ON "ContactSubmission"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_expiresAt_idx" ON "ContactSubmission"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsagePeriod_userId_periodStart_key" ON "AiUsagePeriod"("userId", "periodStart");

-- CreateIndex
CREATE INDEX "AiUsagePeriod_periodStart_idx" ON "AiUsagePeriod"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsageEvent_requestId_key" ON "AiUsageEvent"("requestId");

-- CreateIndex
CREATE INDEX "AiUsageEvent_userId_createdAt_idx" ON "AiUsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GithubInstallation_installationId_key" ON "GithubInstallation"("installationId");

-- CreateIndex
CREATE INDEX "GithubInstallation_userId_idx" ON "GithubInstallation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubInstallNonce_nonce_key" ON "GithubInstallNonce"("nonce");

-- CreateIndex
CREATE INDEX "GithubInstallNonce_userId_expiresAt_idx" ON "GithubInstallNonce"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_githubRepoId_key" ON "GithubRepository"("githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "GithubRepository_projectId_key" ON "GithubRepository"("projectId");

-- CreateIndex
CREATE INDEX "GithubRepository_installationId_idx" ON "GithubRepository"("installationId");

-- CreateIndex
CREATE UNIQUE INDEX "RepoArchitecture_repositoryId_key" ON "RepoArchitecture"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RepoFileIndex_repositoryId_path_key" ON "RepoFileIndex"("repositoryId", "path");

-- CreateIndex
CREATE INDEX "RepoFileIndex_repositoryId_role_idx" ON "RepoFileIndex"("repositoryId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RepoCommitReview_repositoryId_sha_key" ON "RepoCommitReview"("repositoryId", "sha");

-- CreateIndex
CREATE INDEX "RepoCommitReview_repositoryId_createdAt_idx" ON "RepoCommitReview"("repositoryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningMistake_userId_category_key" ON "LearningMistake"("userId", "category");

-- CreateIndex
CREATE INDEX "AiHintSession_userId_createdAt_idx" ON "AiHintSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiHintSession_projectId_createdAt_idx" ON "AiHintSession"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "AiDocumentDraft_projectId_createdAt_idx" ON "AiDocumentDraft"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiUsagePeriod" ADD CONSTRAINT "AiUsagePeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubInstallation" ADD CONSTRAINT "GithubInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubRepository" ADD CONSTRAINT "GithubRepository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GithubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubRepository" ADD CONSTRAINT "GithubRepository_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepoArchitecture" ADD CONSTRAINT "RepoArchitecture_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GithubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepoFileIndex" ADD CONSTRAINT "RepoFileIndex_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GithubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepoCommitReview" ADD CONSTRAINT "RepoCommitReview_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GithubRepository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMistake" ADD CONSTRAINT "LearningMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHintSession" ADD CONSTRAINT "AiHintSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHintSession" ADD CONSTRAINT "AiHintSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiHintSession" ADD CONSTRAINT "AiHintSession_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GithubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDocumentDraft" ADD CONSTRAINT "AiDocumentDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDocumentDraft" ADD CONSTRAINT "AiDocumentDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDocumentDraft" ADD CONSTRAINT "AiDocumentDraft_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GithubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
