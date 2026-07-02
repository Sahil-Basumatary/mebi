-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubUsername" TEXT,
ADD COLUMN     "showGithub" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "themePreference" "ThemePreference" NOT NULL DEFAULT 'LIGHT';
