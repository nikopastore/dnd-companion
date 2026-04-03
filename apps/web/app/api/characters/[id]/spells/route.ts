import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import { canClassCastSpells, getHighestSpellLevelFromSlots, isKnownCaster, isPactCaster } from "@/lib/character-progression";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { spellId, sourceClassId } = await request.json().catch(() => ({}));

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      class: true,
      multiclasses: {
        include: {
          class: true,
        },
      },
      spells: { select: { spellId: true } },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const selectedClassId =
    typeof sourceClassId === "string" && sourceClassId.trim() ? sourceClassId.trim() : character.classId;
  const sourceClass =
    selectedClassId === character.classId
      ? character.class
      : character.multiclasses.find((entry) => entry.classId === selectedClassId)?.class;

  if (!sourceClass) {
    return NextResponse.json({ error: "Class track not found on this character" }, { status: 400 });
  }

  if (!canClassCastSpells(sourceClass.name)) {
    return NextResponse.json({ error: "This class does not cast spells" }, { status: 400 });
  }

  const knownSpellIds = new Set(character.spells.map((spell) => spell.spellId));
  if (knownSpellIds.has(String(spellId))) {
    return NextResponse.json({ error: "Spell already learned" }, { status: 409 });
  }

  const highestSpellLevel = getHighestSpellLevelFromSlots(
    (() => {
      const state = isPactCaster(sourceClass.name) ? character.pactSpellSlotsState : character.spellSlotsState;
      if (!state || typeof state !== "object") return null;
      return Object.entries(state as Record<string, unknown>).reduce<Record<string, number>>(
        (acc, [level, entry]) => {
          if (!entry || typeof entry !== "object") return acc;
          const total = Number((entry as Record<string, unknown>).total ?? 0);
          if (total > 0) acc[level] = total;
          return acc;
        },
        {}
      );
    })()
  );

  const spell = await prisma.spell.findFirst({
    where: {
      id: String(spellId),
      classes: { has: sourceClass.name.toLowerCase() },
      level: { lte: highestSpellLevel },
    },
  });

  if (!spell) {
    return NextResponse.json({ error: "Spell is not available to this character" }, { status: 400 });
  }

  const learned = await prisma.characterSpell.create({
    data: {
      characterId: character.id,
      spellId: spell.id,
      sourceClassId: sourceClass.id,
      isPrepared: isKnownCaster(sourceClass.name),
    },
    include: {
      spell: true,
      sourceClass: { select: { id: true, name: true, primaryAbility: true } },
    },
  });

  return NextResponse.json(learned, { status: 201 });
}
