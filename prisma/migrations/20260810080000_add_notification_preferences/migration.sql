-- Notification preference toggles for settings (Notion-style Notifications panel).
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "notifyInbox" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyProjectActivity" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "notifyMarketing" BOOLEAN NOT NULL DEFAULT false;
