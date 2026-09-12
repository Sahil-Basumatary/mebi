DELETE FROM "GithubInstallNonce"
WHERE "userId" NOT IN (SELECT "id" FROM "User");

ALTER TABLE "GithubInstallNonce"
ADD CONSTRAINT "GithubInstallNonce_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
