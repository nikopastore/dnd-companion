-- AlterTable
ALTER TABLE "Campaign"
ADD COLUMN "accessibilityOptions" JSONB,
ADD COLUMN "edition" TEXT NOT NULL DEFAULT '5e',
ADD COLUMN "factions" JSONB,
ADD COLUMN "groupRenown" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "groupReputation" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "houseRules" JSONB,
ADD COLUMN "onboardingMode" TEXT NOT NULL DEFAULT 'beginner',
ADD COLUMN "partyTreasury" JSONB,
ADD COLUMN "playerCanon" JSONB,
ADD COLUMN "rumors" JSONB,
ADD COLUMN "scheduledEvents" JSONB,
ADD COLUMN "sessionZero" JSONB,
ADD COLUMN "setting" TEXT,
ADD COLUMN "sharedPlans" JSONB,
ADD COLUMN "storyThreads" JSONB,
ADD COLUMN "stronghold" JSONB,
ADD COLUMN "system" TEXT NOT NULL DEFAULT 'D&D',
ADD COLUMN "tone" TEXT,
ADD COLUMN "worldCanon" JSONB,
ADD COLUMN "worldName" TEXT,
ADD COLUMN "worldSummary" TEXT;

-- AlterTable
ALTER TABLE "GameSession"
ADD COLUMN "attendance" JSONB,
ADD COLUMN "dmRecap" TEXT,
ADD COLUMN "liveNotes" JSONB,
ADD COLUMN "objectives" JSONB,
ADD COLUMN "pacingNotes" TEXT,
ADD COLUMN "preparedChecklist" JSONB,
ADD COLUMN "publicRecap" TEXT;
