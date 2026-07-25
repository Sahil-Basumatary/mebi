-- Repair: prior startup/shortcuts migration was recorded applied, but this table was missing in Neon.
CREATE TABLE IF NOT EXISTS "UserShortcutBinding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "combo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserShortcutBinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserShortcutBinding_userId_idx" ON "UserShortcutBinding"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserShortcutBinding_userId_actionId_key" ON "UserShortcutBinding"("userId", "actionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserShortcutBinding_userId_fkey'
  ) THEN
    ALTER TABLE "UserShortcutBinding"
      ADD CONSTRAINT "UserShortcutBinding_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
