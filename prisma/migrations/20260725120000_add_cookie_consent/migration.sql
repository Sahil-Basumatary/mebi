-- AlterTable
ALTER TABLE "User" ADD COLUMN "cookieConsentAt" TIMESTAMP(3),
ADD COLUMN "cookiePreferences" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cookieAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cookieMarketing" BOOLEAN NOT NULL DEFAULT false;
