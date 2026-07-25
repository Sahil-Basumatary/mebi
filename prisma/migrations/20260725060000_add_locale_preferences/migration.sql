ALTER TABLE "User" ADD COLUMN "spellcheckerLanguage" TEXT NOT NULL DEFAULT 'en-GB',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'auto';
