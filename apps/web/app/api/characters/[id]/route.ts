import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";

// GET /api/characters/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      race: true,
      subrace: true,
      class: { include: { levels: { where: { level: { lte: 20 } }, orderBy: { level: "asc" } } } },
      background: true,
      items: { include: { equipment: true }, orderBy: { name: "asc" } },
      spells: { include: { spell: true } },
      features: { orderBy: { level: "asc" } },
      conditions: true,
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Not your character" }, { status: 403 });
  }

  return NextResponse.json(character);
}

// PATCH /api/characters/:id — update character fields
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.character.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  // Allowlist of updatable fields
  const allowedFields = [
    "name", "currentHP", "tempHP", "maxHP", "armorClass", "initiative", "speed",
    "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
    "deathSaveSuccesses", "deathSaveFailures", "exhaustionLevel",
    "hitDiceRemaining", "classResources", "concentrationSpell",
    "copperPieces", "silverPieces", "electrumPieces", "goldPieces", "platinumPieces",
    "level", "experiencePoints", "proficiencyBonus",
    "skillProficiencies", "skillExpertise", "saveProficiencies",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updateData[field] = body[field];
  }

  const updated = await prisma.character.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
