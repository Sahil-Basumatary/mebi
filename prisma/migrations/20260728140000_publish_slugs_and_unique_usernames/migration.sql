-- AlterTable
ALTER TABLE "Project" ADD COLUMN "slug" TEXT,
ADD COLUMN "summary" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_publishedAt_idx" ON "Project"("publishedAt");

-- Normalize usernames to lowercase and disambiguate collisions before uniqueness.
UPDATE "User"
SET "username" = lower(trim("username"))
WHERE "username" IS NOT NULL;

UPDATE "User" AS u
SET "username" = u."username" || '_' || substr(md5(u."id"), 1, 6)
FROM (
  SELECT "username"
  FROM "User"
  WHERE "username" IS NOT NULL
  GROUP BY "username"
  HAVING COUNT(*) > 1
) AS dups
WHERE u."username" = dups."username"
  AND u."id" <> (
    SELECT u2."id"
    FROM "User" AS u2
    WHERE u2."username" = dups."username"
    ORDER BY u2."createdAt" ASC
    LIMIT 1
  );

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
