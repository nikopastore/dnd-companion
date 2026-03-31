import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { getAbilityModifier } from "@dnd-companion/shared";

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
  const { name, raceId, subraceId, classId, backgroundId, abilityScores, campaignId } = body;

  if (!name || !raceId || !classId || !backgroundId || !abilityScores) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get class info for HP calculation
  const charClass = await prisma.characterClass.findUnique({ where: { id: classId } });
  if (!charClass) {
    return NextResponse.json({ error: "Invalid class" }, { status: 400 });
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
      speed: 30, // Will be set from race
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
      hitDiceRemaining: 1,
      hitDiceTotal: 1,
      classResources: classLevel1?.resources ?? undefined,
    },
    include: {
      race: { select: { name: true } },
      class: { select: { name: true } },
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
