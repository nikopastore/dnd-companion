import type { AbilityKey } from "../constants/abilities";
import type { ConditionKey } from "../constants/conditions";

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ClassResources {
  /** Barbarian */
  ragesRemaining?: number;
  ragesTotal?: number;
  /** Bard */
  bardicInspirationRemaining?: number;
  bardicInspirationTotal?: number;
  bardicInspirationDie?: string;
  /** Cleric / Paladin */
  channelDivinityRemaining?: number;
  channelDivinityTotal?: number;
  /** Druid */
  wildShapeRemaining?: number;
  wildShapeTotal?: number;
  /** Fighter */
  secondWindUsed?: boolean;
  actionSurgeUsed?: boolean;
  superiorityDiceRemaining?: number;
  superiorityDiceTotal?: number;
  superiorityDieSize?: string;
  /** Monk */
  kiPointsRemaining?: number;
  kiPointsTotal?: number;
  /** Paladin */
  layOnHandsRemaining?: number;
  layOnHandsTotal?: number;
  /** Sorcerer */
  sorceryPointsRemaining?: number;
  sorceryPointsTotal?: number;
  /** Warlock (pact slots tracked separately) */
  pactSlotsRemaining?: number;
  pactSlotsTotal?: number;
  pactSlotLevel?: number;
  /** Wizard */
  arcaneRecoveryUsed?: boolean;
}

export interface SpellSlots {
  1?: { used: number; total: number };
  2?: { used: number; total: number };
  3?: { used: number; total: number };
  4?: { used: number; total: number };
  5?: { used: number; total: number };
  6?: { used: number; total: number };
  7?: { used: number; total: number };
  8?: { used: number; total: number };
  9?: { used: number; total: number };
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  className: string;
  raceName: string;
  currentHP: number;
  maxHP: number;
  armorClass: number;
  conditions: ConditionKey[];
}
