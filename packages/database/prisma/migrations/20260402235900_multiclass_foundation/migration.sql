ALTER TABLE "Character"
ADD COLUMN IF NOT EXISTS "primaryClassLevel" INTEGER NOT NULL DEFAULT 1;

UPDATE "Character"
SET "primaryClassLevel" = GREATEST("level", 1)
WHERE "primaryClassLevel" = 1;

ALTER TABLE "CharacterSpell"
ADD COLUMN IF NOT EXISTS "sourceClassId" TEXT;

UPDATE "CharacterSpell" AS cs
SET "sourceClassId" = c."classId"
FROM "Character" AS c
WHERE c."id" = cs."characterId"
  AND cs."sourceClassId" IS NULL;

CREATE TABLE IF NOT EXISTS "CharacterMulticlass" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "subclassName" TEXT,
    "characterId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterMulticlass_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterMulticlass_characterId_classId_key"
ON "CharacterMulticlass"("characterId", "classId");

CREATE INDEX IF NOT EXISTS "CharacterSpell_sourceClassId_idx"
ON "CharacterSpell"("sourceClassId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CharacterSpell_sourceClassId_fkey'
  ) THEN
    ALTER TABLE "CharacterSpell"
    ADD CONSTRAINT "CharacterSpell_sourceClassId_fkey"
    FOREIGN KEY ("sourceClassId") REFERENCES "CharacterClass"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CharacterMulticlass_characterId_fkey'
  ) THEN
    ALTER TABLE "CharacterMulticlass"
    ADD CONSTRAINT "CharacterMulticlass_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "Character"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CharacterMulticlass_classId_fkey'
  ) THEN
    ALTER TABLE "CharacterMulticlass"
    ADD CONSTRAINT "CharacterMulticlass_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "CharacterClass"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
