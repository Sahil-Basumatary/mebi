-- AlterEnum
CREATE TYPE "StartupPreference" AS ENUM ('HOME', 'LAST_VISITED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "startupPreference" "StartupPreference" NOT NULL DEFAULT 'HOME';
ALTER TABLE "User" ADD COLUMN "lastVisitedPath" TEXT;

-- CreateTable
CREATE TABLE "UserShortcutBinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "combo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserShortcutBinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserShortcutBinding_userId_idx" ON "UserShortcutBinding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserShortcutBinding_userId_actionId_key" ON "UserShortcutBinding"("userId", "actionId");

-- AddForeignKey
ALTER TABLE "UserShortcutBinding" ADD CONSTRAINT "UserShortcutBinding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
