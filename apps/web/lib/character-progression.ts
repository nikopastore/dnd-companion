export type SpellSlotMap = Record<string, number>;

export interface ClassTrackSummary {
  classId: string;
  className: string;
  level: number;
  subclassName?: string | null;
}

const MULTICLASS_SPELL_SLOTS: Record<number, SpellSlotMap> = {
  1: { "1": 2 },
  2: { "1": 3 },
  3: { "1": 4, "2": 2 },
  4: { "1": 4, "2": 3 },
  5: { "1": 4, "2": 3, "3": 2 },
  6: { "1": 4, "2": 3, "3": 3 },
  7: { "1": 4, "2": 3, "3": 3, "4": 1 },
  8: { "1": 4, "2": 3, "3": 3, "4": 2 },
  9: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 1 },
  10: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2 },
  11: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1 },
  12: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1 },
  13: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1 },
  14: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1 },
  15: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1 },
  16: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1 },
  17: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 2, "6": 1, "7": 1, "8": 1, "9": 1 },
  18: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 1, "7": 1, "8": 1, "9": 1 },
  19: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 2, "7": 1, "8": 1, "9": 1 },
  20: { "1": 4, "2": 3, "3": 3, "4": 3, "5": 3, "6": 2, "7": 2, "8": 1, "9": 1 },
};

export function getProficiencyBonus(level: number) {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2;
}

export function isPreparedCaster(className: string) {
  return ["Cleric", "Druid", "Paladin", "Wizard"].includes(className);
}

export function isKnownCaster(className: string) {
  return ["Bard", "Ranger", "Sorcerer", "Warlock"].includes(className);
}

export function canClassCastSpells(className: string) {
  return isPreparedCaster(className) || isKnownCaster(className);
}

export function isPactCaster(className: string) {
  return className === "Warlock";
}

function isThirdCaster(params: ClassTrackSummary) {
  if (params.className === "Fighter") {
    return params.subclassName === "Eldritch Knight";
  }

  if (params.className === "Rogue") {
    return params.subclassName === "Arcane Trickster";
  }

  return false;
}

export function getCasterContribution(track: ClassTrackSummary) {
  if (isPactCaster(track.className)) return 0;
  if (["Bard", "Cleric", "Druid", "Sorcerer", "Wizard"].includes(track.className)) return track.level;
  if (["Paladin", "Ranger"].includes(track.className)) return Math.floor(track.level / 2);
  if (isThirdCaster(track)) return Math.floor(track.level / 3);
  return 0;
}

export function supportsSharedSpellSlots(tracks: ClassTrackSummary[]) {
  const casterTracks = tracks.filter((track) => canClassCastSpells(track.className));
  if (casterTracks.length <= 1) return true;
  return !casterTracks.some((track) => isPactCaster(track.className));
}

export function getMulticlassSpellSlots(tracks: ClassTrackSummary[]) {
  if (tracks.length === 0) return null;
  const combinedCasterLevel = tracks.reduce((sum, track) => sum + getCasterContribution(track), 0);
  if (combinedCasterLevel <= 0) return null;
  return MULTICLASS_SPELL_SLOTS[Math.min(combinedCasterLevel, 20)] ?? null;
}

export function getWarlockPactSpellSlots(level: number): SpellSlotMap | null {
  const normalizedLevel = Math.max(0, Math.min(20, level));
  if (normalizedLevel <= 0) return null;
  if (normalizedLevel === 1) return { "1": 1 } as SpellSlotMap;
  if (normalizedLevel === 2) return { "1": 2 } as SpellSlotMap;
  if (normalizedLevel <= 4) return { "2": 2 } as SpellSlotMap;
  if (normalizedLevel <= 6) return { "3": 2 } as SpellSlotMap;
  if (normalizedLevel <= 8) return { "4": 2 } as SpellSlotMap;
  if (normalizedLevel <= 10) return { "5": 2 } as SpellSlotMap;
  if (normalizedLevel <= 16) return { "5": 3 } as SpellSlotMap;
  return { "5": 4 } as SpellSlotMap;
}

export function normalizeSpellSlotsState(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, { current: number; total: number }>;

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, { current: number; total: number }>>(
    (acc, [level, entry]) => {
      if (!entry || typeof entry !== "object") return acc;
      const slot = entry as Record<string, unknown>;
      acc[level] = {
        current: Math.max(0, Number(slot.current ?? 0)),
        total: Math.max(0, Number(slot.total ?? 0)),
      };
      return acc;
    },
    {}
  );
}

export function buildSpellSlotsState(
  spellSlots: SpellSlotMap | null | undefined,
  existingState?: unknown
) {
  const normalizedExisting = normalizeSpellSlotsState(existingState);
  if (!spellSlots) return normalizedExisting;

  return Object.entries(spellSlots).reduce<Record<string, { current: number; total: number }>>(
    (acc, [level, total]) => {
      const nextTotal = Math.max(0, Number(total) || 0);
      const previous = normalizedExisting[level];
      acc[level] = {
        total: nextTotal,
        current: previous ? Math.min(previous.current, nextTotal) : nextTotal,
      };
      return acc;
    },
    {}
  );
}

export function getHighestSpellLevelFromSlots(spellSlots: SpellSlotMap | null | undefined) {
  if (!spellSlots) return 0;

  return Object.keys(spellSlots)
    .map((level) => Number(level))
    .filter((level) => !Number.isNaN(level) && (spellSlots[String(level)] ?? 0) > 0)
    .sort((a, b) => b - a)[0] ?? 0;
}

export function getDefaultHitPointIncrease(hitDie: number, constitutionModifier: number) {
  return Math.max(1, Math.floor(hitDie / 2) + 1 + constitutionModifier);
}

export function getPreparedSpellLimit(params: {
  className: string;
  level: number;
  primaryAbilityModifier: number;
}) {
  const { className, level, primaryAbilityModifier } = params;

  switch (className) {
    case "Cleric":
    case "Druid":
    case "Wizard":
      return Math.max(1, level + primaryAbilityModifier);
    case "Paladin":
      return Math.max(1, Math.floor(level / 2) + primaryAbilityModifier);
    default:
      return null;
  }
}

export function getProgressionHighlights(params: {
  className: string;
  currentLevel: number;
  nextLevel: number;
  currentSpellSlots: SpellSlotMap | null | undefined;
  nextSpellSlots: SpellSlotMap | null | undefined;
  currentResources: Record<string, unknown> | null | undefined;
  nextResources: Record<string, unknown> | null | undefined;
  currentProficiencyBonus: number;
  nextProficiencyBonus: number;
}) {
  const {
    currentLevel,
    nextLevel,
    currentSpellSlots,
    nextSpellSlots,
    currentResources,
    nextResources,
    currentProficiencyBonus,
    nextProficiencyBonus,
  } = params;

  const notes: string[] = [`Advance from level ${currentLevel} to level ${nextLevel}.`];

  if (nextProficiencyBonus > currentProficiencyBonus) {
    notes.push(`Proficiency bonus increases to +${nextProficiencyBonus}.`);
  }

  const currentMaxSpellLevel = getHighestSpellLevelFromSlots(currentSpellSlots);
  const nextMaxSpellLevel = getHighestSpellLevelFromSlots(nextSpellSlots);
  if (nextMaxSpellLevel > currentMaxSpellLevel) {
    notes.push(`Unlocks level ${nextMaxSpellLevel} spells.`);
  } else if (nextSpellSlots && JSON.stringify(currentSpellSlots || {}) !== JSON.stringify(nextSpellSlots || {})) {
    notes.push("Spell slot totals increase.");
  }

  if (JSON.stringify(currentResources || {}) !== JSON.stringify(nextResources || {})) {
    notes.push("Class resources increase at this level.");
  }

  return notes;
}
