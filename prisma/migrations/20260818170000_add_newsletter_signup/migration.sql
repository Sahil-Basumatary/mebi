CREATE TABLE IF NOT EXISTS "NewsletterSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "unsubscribeToken" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSignup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSignup_email_key" ON "NewsletterSignup"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSignup_unsubscribeToken_key" ON "NewsletterSignup"("unsubscribeToken");
CREATE INDEX IF NOT EXISTS "NewsletterSignup_ipHash_updatedAt_idx" ON "NewsletterSignup"("ipHash", "updatedAt");
