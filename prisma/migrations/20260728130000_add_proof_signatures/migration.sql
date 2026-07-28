-- CreateTable
CREATE TABLE "ProofSignature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "signerId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProofSignature_projectId_idx" ON "ProofSignature"("projectId");

-- CreateIndex
CREATE INDEX "ProofSignature_subjectId_idx" ON "ProofSignature"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProofSignature_projectId_signerId_subjectId_key" ON "ProofSignature"("projectId", "signerId", "subjectId");

-- AddForeignKey
ALTER TABLE "ProofSignature" ADD CONSTRAINT "ProofSignature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofSignature" ADD CONSTRAINT "ProofSignature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofSignature" ADD CONSTRAINT "ProofSignature_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
