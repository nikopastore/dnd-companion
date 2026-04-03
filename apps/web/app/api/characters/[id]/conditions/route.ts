import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import type { ConditionKey } from "@dnd-companion/shared";

const VALID_CONDITIONS = new Set<ConditionKey>([
  "BLINDED",
  "CHARMED",
  "DEAFENED",
  "EXHAUSTION",
  "FRIGHTENED",
  "GRAPPLED",
  "INCAPACITATED",
  "INVISIBLE",
  "PARALYZED",
  "PETRIFIED",
  "POISONED",
  "PRONE",
  "RESTRAINED",
  "STUNNED",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const condition = String(body.condition || "").toUpperCase() as ConditionKey;

  if (!VALID_CONDITIONS.has(condition)) {
    return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
  }

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      conditions: true,
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = character.conditions.find((entry) => entry.condition === condition);
  if (existing) {
    await prisma.characterCondition.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ success: true, active: false });
  }

  await prisma.characterCondition.create({
    data: {
      characterId: character.id,
      condition,
    },
  });

  return NextResponse.json({ success: true, active: true });
}
