-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "socialLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];
