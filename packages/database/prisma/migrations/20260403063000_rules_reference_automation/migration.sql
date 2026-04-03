-- AlterTable
ALTER TABLE "Character"
ADD COLUMN "automationMode" TEXT NOT NULL DEFAULT 'ASSISTED',
ADD COLUMN "rulesBookmarks" JSONB;
