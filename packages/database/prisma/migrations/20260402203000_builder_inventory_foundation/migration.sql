-- AlterTable
ALTER TABLE "Character" ADD COLUMN "backstory" TEXT;

-- AlterTable
ALTER TABLE "CharacterItem"
ADD COLUMN "category" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "rarity" TEXT,
ADD COLUMN "sourceSessionItemId" TEXT,
ADD COLUMN "value" TEXT;

-- AlterTable
ALTER TABLE "SessionItem"
ADD COLUMN "category" TEXT,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
