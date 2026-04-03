import { NextResponse } from "next/server";
import { Prisma, prisma } from "@dnd-companion/database";
import { auth } from "@/lib/auth";
import {
  buildSpellSlotsState,
  canClassCastSpells,
  getDefaultHitPointIncrease,
  getHighestSpellLevelFromSlots,
  getMulticlassSpellSlots,
  getProficiencyBonus,
  getWarlockPactSpellSlots,
  isPactCaster,
  type ClassTrackSummary,
  type SpellSlotMap,
} from "@/lib/character-progression";
import { getAbilityModifier, type AbilityKey } from "@dnd-companion/shared";
import {
  type ClassChoiceOption,
  type FeatOption,
  getAbilityScoreImprovementLevels,
  getClassChoiceGroups,
  getFeatById,
  getSubclassUnlockLevel,
} from "@/lib/character-reference";

function toFeatures(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const name = String(item.name || "").trim();
      const description = String(item.description || "").trim();
      if (!name || !description) return null;
      return { name, description };
    })
    .filter((entry): entry is { name: string; description: string } => Boolean(entry));
}

function getTrackLevelData(
  levels: Array<{ level: number; spellSlots: unknown; resources: unknown; features: unknown }>,
  level: number
) {
  return levels.find((entry) => entry.level === level) ?? null;
}

function parseAbilityScoreIncreases(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Partial<Record<AbilityKey, number>>;
  }

  return (["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as AbilityKey[]).reduce(
    (acc, key) => {
      const nextValue = Number((value as Record<string, unknown>)[key] ?? 0);
      if (nextValue > 0) acc[key] = nextValue;
      return acc;
    },
    {} as Partial<Record<AbilityKey, number>>
  );
}

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

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          levels: {
            where: { level: { gte: 1, lte: 20 } },
            orderBy: { level: "asc" },
          },
        },
      },
      multiclasses: {
        include: {
          class: {
            include: {
              levels: {
                where: { level: { gte: 1, lte: 20 } },
                orderBy: { level: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      features: true,
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (character.level >= 20) {
    return NextResponse.json({ error: "Character is already at level 20" }, { status: 400 });
  }

  const requestedClassId =
    typeof body.targetClassId === "string" && body.targetClassId.trim()
      ? body.targetClassId.trim()
      : character.classId;

  const existingMulticlass = character.multiclasses.find((entry) => entry.classId === requestedClassId) ?? null;
  const targetClass =
    requestedClassId === character.classId
      ? character.class
      : existingMulticlass?.class ??
        (await prisma.characterClass.findUnique({
          where: { id: requestedClassId },
          include: {
            levels: {
              where: { level: { gte: 1, lte: 20 } },
              orderBy: { level: "asc" },
            },
          },
        }));

  if (!targetClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const nextCharacterLevel = character.level + 1;
  const targetCurrentLevel =
    requestedClassId === character.classId ? character.primaryClassLevel : existingMulticlass?.level ?? 0;
  const nextTrackLevel = targetCurrentLevel + 1;

  if (nextTrackLevel > 20) {
    return NextResponse.json({ error: "This class track is already at level 20" }, { status: 400 });
  }

  const nextClassLevel = getTrackLevelData(targetClass.levels, nextTrackLevel);
  if (!nextClassLevel) {
    return NextResponse.json({ error: "Class progression data not found" }, { status: 400 });
  }

  const currentTracks: ClassTrackSummary[] = [
    {
      classId: character.classId,
      className: character.class.name,
      level: character.primaryClassLevel,
      subclassName: character.subclassName,
    },
    ...character.multiclasses.map((entry) => ({
      classId: entry.classId,
      className: entry.class.name,
      level: entry.level,
      subclassName: entry.subclassName,
    })),
  ];

  const nextTracks = currentTracks.some((track) => track.classId === requestedClassId)
    ? currentTracks.map((track) =>
        track.classId === requestedClassId ? { ...track, level: nextTrackLevel } : track
      )
    : [
        ...currentTracks,
        {
          classId: targetClass.id,
          className: targetClass.name,
          level: 1,
          subclassName: null,
        },
      ];

  const constitutionModifier = getAbilityModifier(character.constitution);
  const requestedHpGain = Number(body.hpGain);
  const hpGain = Math.max(
    1,
    Number.isFinite(requestedHpGain)
      ? requestedHpGain
      : getDefaultHitPointIncrease(targetClass.hitDie, constitutionModifier)
  );

  const currentTargetSubclass =
    requestedClassId === character.classId ? character.subclassName : existingMulticlass?.subclassName ?? null;
  const subclassName =
    typeof body.subclassName === "string" && body.subclassName.trim()
      ? body.subclassName.trim()
      : currentTargetSubclass;

  const abilityScoreIncreases = parseAbilityScoreIncreases(body.abilityScoreIncreases);
  const totalAsiPoints = Object.values(abilityScoreIncreases).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const featIds = Array.isArray(body.featIds)
    ? body.featIds.map((value: unknown) => String(value)).filter(Boolean)
    : [];
  const classChoiceIds = Array.isArray(body.classChoiceIds)
    ? body.classChoiceIds.map((value: unknown) => String(value)).filter(Boolean)
    : [];
  const spellIds = Array.isArray(body.learnSpellIds)
    ? body.learnSpellIds.map((value: unknown) => String(value)).filter(Boolean)
    : [];

  const sharedSpellSlots: SpellSlotMap | null =
    nextTracks.length === 1
      ? isPactCaster(targetClass.name)
        ? null
        : ((nextClassLevel.spellSlots as Record<string, number> | null | undefined) ?? null)
      : getMulticlassSpellSlots(nextTracks);
  const pactSpellSlots = (() => {
    const warlockTrack = nextTracks.find((track) => isPactCaster(track.className));
    return warlockTrack ? getWarlockPactSpellSlots(warlockTrack.level) : null;
  })();

  const highestSpellLevel = getHighestSpellLevelFromSlots(
    isPactCaster(targetClass.name) ? pactSpellSlots : sharedSpellSlots
  );

  const spellsToLearn =
    spellIds.length > 0 && canClassCastSpells(targetClass.name)
      ? await prisma.spell.findMany({
          where: {
            id: { in: spellIds },
            classes: { has: targetClass.name.toLowerCase() },
            level: { lte: highestSpellLevel },
          },
        })
      : [];

  if (spellIds.length > 0 && !canClassCastSpells(targetClass.name)) {
    return NextResponse.json({ error: "This class does not learn spells" }, { status: 400 });
  }

  const knownFeatureNames = new Set(character.features.map((feature) => feature.name));
  const existingFeatNames = new Set(
    character.features.filter((feature) => feature.source === "Feat").map((feature) => feature.name)
  );
  const existingCharacterSpells = await prisma.characterSpell.findMany({
    where: { characterId: character.id },
    select: { spellId: true },
  });
  const existingSpellIds = new Set(existingCharacterSpells.map((spell) => spell.spellId));

  const classFeatures = toFeatures(nextClassLevel.features);
  const featuresToCreate = classFeatures.filter((feature) => !knownFeatureNames.has(feature.name));
  const classChoiceGroups = getClassChoiceGroups(targetClass.name, nextTrackLevel, subclassName);
  const validChoiceIds = new Set(classChoiceGroups.flatMap((group) => group.options.map((option) => option.id)));
  const invalidChoiceIds = classChoiceIds.filter((choiceId: string) => !validChoiceIds.has(choiceId));
  if (invalidChoiceIds.length > 0) {
    return NextResponse.json({ error: "Invalid class-specific feature choice" }, { status: 400 });
  }
  const duplicateKnownChoice = classChoiceGroups
    .flatMap((group) => group.options)
    .find((option) => classChoiceIds.includes(option.id) && knownFeatureNames.has(option.name));
  if (duplicateKnownChoice) {
    return NextResponse.json(
      { error: `${duplicateKnownChoice.name} is already known by this character` },
      { status: 400 }
    );
  }
  const classChoiceOptionsToCreate = classChoiceGroups.flatMap((group) => {
    const chosenIds = classChoiceIds.filter((choiceId: string) =>
      group.options.some((option) => option.id === choiceId)
    );

    return chosenIds
      .map((choiceId: string) => {
        const option = group.options.find((entry: ClassChoiceOption) => entry.id === choiceId);
        if (!option || knownFeatureNames.has(option.name)) return null;
        return {
          option,
          sourceLabel: group.sourceLabel,
        };
      })
      .filter((entry: { option: ClassChoiceOption; sourceLabel: string } | null): entry is { option: ClassChoiceOption; sourceLabel: string } => Boolean(entry));
  });
  const featOptions = featIds
    .map((featId: string) => getFeatById(featId))
    .filter((feat: FeatOption | null): feat is FeatOption => Boolean(feat))
    .filter((feat: FeatOption) => !existingFeatNames.has(feat.name));

  const asiEligible = getAbilityScoreImprovementLevels(targetClass.name).includes(nextTrackLevel);
  if (!asiEligible && (totalAsiPoints > 0 || featIds.length > 0)) {
    return NextResponse.json(
      { error: "This class level does not grant a feat or ability score improvement" },
      { status: 400 }
    );
  }

  if (totalAsiPoints > 0 && featIds.length > 0) {
    return NextResponse.json(
      { error: "Choose either a feat or an ability score improvement at this level" },
      { status: 400 }
    );
  }

  if (totalAsiPoints > 2 || Object.values(abilityScoreIncreases).some((value) => Number(value) > 2)) {
    return NextResponse.json({ error: "Ability score increases cannot exceed two total points" }, { status: 400 });
  }

  if (featIds.length > 1) {
    return NextResponse.json({ error: "Only one feat can be selected at a time" }, { status: 400 });
  }

  if (nextTrackLevel >= getSubclassUnlockLevel(targetClass.name) && subclassName && subclassName.length > 80) {
    return NextResponse.json({ error: "Subclass name is too long" }, { status: 400 });
  }

  try {
    classChoiceGroups.forEach((group) => {
      const chosenIds = classChoiceIds.filter((choiceId: string) =>
        group.options.some((option) => option.id === choiceId)
      );
      if (chosenIds.length !== group.selectionCount) {
        throw new Error(`${group.title} requires ${group.selectionCount} selection${group.selectionCount > 1 ? "s" : ""}`);
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid class feature choice" },
      { status: 400 }
    );
  }

  const abilityUpdates = (["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as AbilityKey[]).reduce(
    (acc, ability) => {
      const increase = Number(abilityScoreIncreases[ability] || 0);
      if (increase <= 0) return acc;
      acc[ability] = Math.min(20, (character[ability] as number) + increase);
      return acc;
    },
    {} as Partial<Record<AbilityKey, number>>
  );

  const nextPrimaryLevel = requestedClassId === character.classId ? nextTrackLevel : character.primaryClassLevel;
  const nextPrimaryLevelData = getTrackLevelData(character.class.levels, nextPrimaryLevel);

  await prisma.$transaction(async (tx) => {
    await tx.character.update({
      where: { id: character.id },
      data: {
        level: nextCharacterLevel,
        primaryClassLevel: nextPrimaryLevel,
        subclassName: requestedClassId === character.classId ? subclassName : character.subclassName,
        maxHP: character.maxHP + hpGain,
        currentHP: character.currentHP + hpGain,
        hitDiceTotal: character.hitDiceTotal + 1,
        hitDiceRemaining: Math.min(character.hitDiceRemaining + 1, character.hitDiceTotal + 1),
        proficiencyBonus: getProficiencyBonus(nextCharacterLevel),
        classResources:
          (nextPrimaryLevelData?.resources as Prisma.InputJsonValue | null | undefined) ?? Prisma.JsonNull,
        spellSlotsState: buildSpellSlotsState(sharedSpellSlots, character.spellSlotsState) as unknown as Prisma.InputJsonValue,
        pactSpellSlotsState: buildSpellSlotsState(pactSpellSlots, character.pactSpellSlotsState) as unknown as Prisma.InputJsonValue,
        ...abilityUpdates,
      },
    });

    if (requestedClassId !== character.classId) {
      if (existingMulticlass) {
        await tx.characterMulticlass.update({
          where: { id: existingMulticlass.id },
          data: { level: nextTrackLevel, subclassName },
        });
      } else {
        await tx.characterMulticlass.create({
          data: {
            characterId: character.id,
            classId: targetClass.id,
            level: 1,
            subclassName,
          },
        });
      }
    }

    if (featuresToCreate.length > 0) {
      await tx.characterFeature.createMany({
        data: featuresToCreate.map((feature) => ({
          characterId: character.id,
          name: feature.name,
          description: feature.description,
          source: "Class",
          level: nextCharacterLevel,
        })),
      });
    }

    if (classChoiceOptionsToCreate.length > 0) {
      await tx.characterFeature.createMany({
        data: classChoiceOptionsToCreate.map(({ option, sourceLabel }) => ({
          characterId: character.id,
          name: option.name,
          description: option.description,
          source: sourceLabel,
          level: nextCharacterLevel,
        })),
      });
    }

    if (spellsToLearn.length > 0) {
      await tx.characterSpell.createMany({
        data: spellsToLearn
          .filter((spell) => !existingSpellIds.has(spell.id))
          .map((spell) => ({
            characterId: character.id,
            spellId: spell.id,
            sourceClassId: targetClass.id,
            isPrepared: false,
          })),
        skipDuplicates: true,
      });
    }

    if (featOptions.length > 0) {
      await tx.characterFeature.createMany({
        data: featOptions.map((feat: FeatOption) => ({
          characterId: character.id,
          name: feat.name,
          description: feat.description,
          source: "Feat",
          level: nextCharacterLevel,
        })),
      });
    }
  });

  return NextResponse.json({ success: true, level: nextCharacterLevel, classLevel: nextTrackLevel });
}
