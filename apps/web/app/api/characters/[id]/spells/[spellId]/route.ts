import { NextResponse } from "next/server";
import { prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import {
  getPreparedSpellLimit,
  isKnownCaster,
  isPreparedCaster,
} from "@/lib/character-progression";
import { getAbilityModifier } from "@dnd-companion/shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; spellId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, spellId } = await params;
  const { isPrepared } = await request.json().catch(() => ({}));

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      class: true,
      multiclasses: {
        include: {
          class: true,
        },
      },
      spells: {
        include: {
          spell: true,
          sourceClass: { select: { id: true, name: true, primaryAbility: true } },
        },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = character.spells.find((entry) => entry.spellId === spellId);
  if (!record) {
    return NextResponse.json({ error: "Spell not found" }, { status: 404 });
  }

  const sourceClass = record.sourceClass ?? character.class;
  const sourceClassLevel =
    sourceClass.id === character.classId
      ? character.primaryClassLevel
      : character.multiclasses.find((entry) => entry.classId === sourceClass.id)?.level ?? 0;

  if (isKnownCaster(sourceClass.name)) {
    const updated = await prisma.characterSpell.update({
      where: { id: record.id },
      data: { isPrepared: true },
      include: {
        spell: true,
        sourceClass: { select: { id: true, name: true, primaryAbility: true } },
      },
    });
    return NextResponse.json(updated);
  }

  if (!isPreparedCaster(sourceClass.name)) {
    return NextResponse.json({ error: "This class does not prepare spells" }, { status: 400 });
  }

  const abilityKey = sourceClass.primaryAbility as
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma";
  const preparedLimit = getPreparedSpellLimit({
    className: sourceClass.name,
    level: sourceClassLevel,
    primaryAbilityModifier: getAbilityModifier(character[abilityKey]),
  });

  const preparedCount = character.spells.filter((entry) => {
    const entrySourceClassId = entry.sourceClass?.id ?? character.classId;
    return entry.isPrepared && entry.spellId !== spellId && entrySourceClassId === sourceClass.id;
  }).length;
  if (Boolean(isPrepared) && preparedLimit !== null && preparedCount >= preparedLimit) {
    return NextResponse.json({ error: "Prepared spell limit reached" }, { status: 400 });
  }

  const updated = await prisma.characterSpell.update({
    where: { id: record.id },
    data: { isPrepared: Boolean(isPrepared) },
    include: {
      spell: true,
      sourceClass: { select: { id: true, name: true, primaryAbility: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; spellId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, spellId } = await params;

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      spells: {
        select: {
          id: true,
          spellId: true,
        },
      },
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const record = character.spells.find((entry) => entry.spellId === spellId);
  if (!record) {
    return NextResponse.json({ error: "Spell not found" }, { status: 404 });
  }

  await prisma.characterSpell.delete({
    where: { id: record.id },
  });

  return NextResponse.json({ success: true });
}
