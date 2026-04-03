import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getAbilityModifier } from "@dnd-companion/shared";
import { buildSpellSlotsState, getWarlockPactSpellSlots, isPactCaster } from "@/lib/character-progression";

// GET /api/characters — list user's characters
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    include: {
      race: { select: { name: true } },
      class: { select: { name: true, hitDie: true } },
      multiclasses: {
        include: {
          class: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      background: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(characters);
}

// POST /api/characters — create a new character
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    raceId,
    subraceId,
    classId,
    backgroundId,
    abilityScores,
    campaignId,
    imageUrl,
    backstory,
    personalityTraits,
    ideals,
    bonds,
    flaws,
    personalGoals,
    secrets,
    voiceNotes,
    lastSessionChanges,
    characterTimeline,
    automationMode,
    rulesBookmarks,
  } = body;

  if (!name || !raceId || !classId || !backgroundId || !abilityScores) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [charClass, race] = await Promise.all([
    prisma.characterClass.findUnique({ where: { id: classId } }),
    prisma.race.findUnique({ where: { id: raceId } }),
  ]);

  if (!charClass) {
    return NextResponse.json({ error: "Invalid class" }, { status: 400 });
  }
  if (!race) {
    return NextResponse.json({ error: "Invalid race" }, { status: 400 });
  }

  // Level 1 HP = max hit die + CON modifier
  const conMod = getAbilityModifier(abilityScores.constitution);
  const maxHP = charClass.hitDie + conMod;
  const dexMod = getAbilityModifier(abilityScores.dexterity);

  // Get class level 1 data for resources
  const classLevel1 = await prisma.classLevel.findUnique({
    where: { classId_level: { classId, level: 1 } },
  });

  const character = await prisma.character.create({
    data: {
      name,
      userId: session.user.id,
      imageUrl: imageUrl || null,
      backstory: backstory?.trim() || null,
      personalityTraits: personalityTraits?.trim() || null,
      ideals: ideals?.trim() || null,
      bonds: bonds?.trim() || null,
      flaws: flaws?.trim() || null,
      personalGoals: personalGoals?.trim() || null,
      secrets: secrets?.trim() || null,
      voiceNotes: voiceNotes?.trim() || null,
      lastSessionChanges: lastSessionChanges?.trim() || null,
      characterTimeline: Array.isArray(characterTimeline) ? characterTimeline : undefined,
      automationMode: typeof automationMode === "string" ? automationMode : undefined,
      rulesBookmarks: Array.isArray(rulesBookmarks) ? rulesBookmarks : undefined,
      raceId,
      subraceId: subraceId || null,
      classId,
      backgroundId,
      level: 1,
      experiencePoints: 0,
      currentHP: Math.max(1, maxHP),
      maxHP: Math.max(1, maxHP),
      armorClass: 10 + dexMod, // Base AC, will be modified by armor
      initiative: dexMod,
      speed: race.speed,
      proficiencyBonus: 2,
      strength: abilityScores.strength,
      dexterity: abilityScores.dexterity,
      constitution: abilityScores.constitution,
      intelligence: abilityScores.intelligence,
      wisdom: abilityScores.wisdom,
      charisma: abilityScores.charisma,
      saveProficiencies: charClass.savingThrows,
      skillProficiencies: [],
      skillExpertise: [],
      primaryClassLevel: 1,
      hitDiceRemaining: 1,
      hitDiceTotal: 1,
      classResources: classLevel1?.resources ?? undefined,
      spellSlotsState: isPactCaster(charClass.name)
        ? undefined
        : buildSpellSlotsState(
            (classLevel1?.spellSlots as Record<string, number> | null | undefined) ?? null
          ),
      pactSpellSlotsState: isPactCaster(charClass.name)
        ? buildSpellSlotsState(getWarlockPactSpellSlots(1))
        : undefined,
    } as Prisma.CharacterUncheckedCreateInput,
    include: {
      race: { select: { name: true } },
      class: { select: { name: true } },
      multiclasses: {
        include: {
          class: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      background: { select: { name: true } },
    },
  });

  // If campaignId provided, link character to campaign membership
  if (campaignId) {
    await prisma.campaignMember.updateMany({
      where: {
        userId: session.user.id,
        campaignId,
        characterId: null,
      },
      data: { characterId: character.id },
    });
  }

  return NextResponse.json(character, { status: 201 });
}
