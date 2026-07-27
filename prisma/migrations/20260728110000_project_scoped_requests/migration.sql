-- CreateEnum
CREATE TYPE "ProjectRequestKind" AS ENUM ('JOIN', 'INVITE');

-- CreateTable
CREATE TABLE "ProjectRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "ProjectRequestKind" NOT NULL,
    "message" TEXT NOT NULL,
    "sharedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sharedInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectRequest_toUserId_status_idx" ON "ProjectRequest"("toUserId", "status");

-- CreateIndex
CREATE INDEX "ProjectRequest_fromUserId_status_idx" ON "ProjectRequest"("fromUserId", "status");

-- CreateIndex
CREATE INDEX "ProjectRequest_projectId_status_idx" ON "ProjectRequest"("projectId", "status");

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequest" ADD CONSTRAINT "ProjectRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry over requests that already pointed at a real project. Rows without a
-- projectId cannot become project-scoped requests, so they are dropped.
INSERT INTO "ProjectRequest" (
    "id",
    "fromUserId",
    "toUserId",
    "projectId",
    "kind",
    "message",
    "sharedSkills",
    "sharedInterests",
    "note",
    "status",
    "createdAt",
    "respondedAt"
)
SELECT
    pr."id",
    pr."fromUserId",
    pr."toUserId",
    pr."relatedProjectId",
    'INVITE',
    pr."message",
    pr."sharedSkills",
    pr."sharedInterests",
    pr."projectInterest",
    pr."status",
    pr."createdAt",
    pr."respondedAt"
FROM "PartnershipRequest" pr
WHERE pr."relatedProjectId" IS NOT NULL;

-- DropTable
DROP TABLE "Partnership";

-- DropTable
DROP TABLE "PartnershipRequest";
