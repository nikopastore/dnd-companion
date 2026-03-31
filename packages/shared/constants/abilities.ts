export const ABILITIES = [
  { key: "strength", name: "Strength", abbreviation: "STR" },
  { key: "dexterity", name: "Dexterity", abbreviation: "DEX" },
  { key: "constitution", name: "Constitution", abbreviation: "CON" },
  { key: "intelligence", name: "Intelligence", abbreviation: "INT" },
  { key: "wisdom", name: "Wisdom", abbreviation: "WIS" },
  { key: "charisma", name: "Charisma", abbreviation: "CHA" },
] as const;

export type AbilityKey = (typeof ABILITIES)[number]["key"];

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export const PROFICIENCY_BONUS_BY_LEVEL: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
};

/** Point buy costs for ability scores */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const POINT_BUY_TOTAL = 27;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;
