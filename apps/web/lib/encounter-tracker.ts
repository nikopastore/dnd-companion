import { CONDITIONS, type ConditionKey } from "@dnd-companion/shared";

export interface EncounterMonster {
  name: string;
  cr: string;
  count: number;
  hp: number;
  ac: number;
  notes?: string;
}

export interface EncounterLootItem {
  name: string;
  quantity: number;
  description: string;
}

export interface EncounterTrackerCharacter {
  id: string;
  name: string;
  currentHP: number;
  maxHP: number;
  armorClass: number;
  initiative: number;
  concentrationSpell?: string | null;
  activeConditions?: ConditionKey[];
}

export type EncounterLightingMode = "bright" | "dim" | "dark";

export interface EncounterCombatant {
  id: string;
  name: string;
  kind: "player" | "monster";
  sourceId: string | null;
  initiative: number;
  currentHP: number;
  maxHP: number;
  armorClass: number;
  conditions: ConditionKey[];
  concentrationSpell: string | null;
  notes: string | null;
  defeated: boolean;
  legendaryActionsUsed: number;
  tokenX: number;
  tokenY: number;
  visionRadius: number;
}

export interface EncounterLiveState {
  round: number;
  activeCombatantId: string | null;
  mapLocationId: string | null;
  lightingMode: EncounterLightingMode;
  objective: string;
  environment: string;
  battlefieldNotes: string;
  lairActionInitiative: number | null;
  legendaryPool: number;
  legendaryRemaining: number;
  recentEvents: string[];
  combatants: EncounterCombatant[];
}

const VALID_CONDITIONS = new Set(Object.keys(CONDITIONS));
const VALID_LIGHTING_MODES = new Set<EncounterLightingMode>(["bright", "dim", "dark"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function isConditionKey(value: unknown): value is ConditionKey {
  return typeof value === "string" && VALID_CONDITIONS.has(value);
}

function isLightingMode(value: unknown): value is EncounterLightingMode {
  return typeof value === "string" && VALID_LIGHTING_MODES.has(value as EncounterLightingMode);
}

export function parseEncounterMonsters(value: unknown): EncounterMonster[] {
  if (!Array.isArray(value)) return [] as EncounterMonster[];
  const monsters: EncounterMonster[] = [];
  for (const entry of value) {
    const item = asRecord(entry);
    if (!item) continue;
    const name = String(item.name || "").trim();
    if (!name) continue;
    monsters.push({
      name,
      cr: String(item.cr || "1"),
      count: Math.max(1, Number(item.count ?? 1) || 1),
      hp: Math.max(1, Number(item.hp ?? 1) || 1),
      ac: Math.max(1, Number(item.ac ?? 10) || 10),
      notes: typeof item.notes === "string" ? item.notes : undefined,
    });
  }
  return monsters;
}

export function parseEncounterLoot(value: unknown): EncounterLootItem[] {
  if (!Array.isArray(value)) return [] as EncounterLootItem[];
  const loot: EncounterLootItem[] = [];
  for (const entry of value) {
    const item = asRecord(entry);
    if (!item) continue;
    const name = String(item.name || "").trim();
    if (!name) continue;
    loot.push({
      name,
      quantity: Math.max(1, Number(item.quantity ?? 1) || 1),
      description: String(item.description || ""),
    });
  }
  return loot;
}

function parseCombatant(value: unknown, index: number) {
  const item = asRecord(value);
  if (!item) return null;
  const name = String(item.name || "").trim();
  if (!name) return null;
  const currentHP = Math.max(0, Number(item.currentHP ?? 0) || 0);
  const maxHPSource = item.maxHP ?? currentHP ?? 1;
  const maxHP = Math.max(1, Number(maxHPSource) || 1);
  return {
    id: typeof item.id === "string" && item.id ? item.id : `combatant-${index}`,
    name,
    kind: item.kind === "player" ? "player" : "monster",
    sourceId: typeof item.sourceId === "string" ? item.sourceId : null,
    initiative: Number(item.initiative ?? 0) || 0,
    currentHP,
    maxHP,
    armorClass: Math.max(0, Number(item.armorClass ?? 0) || 0),
    conditions: Array.isArray(item.conditions) ? item.conditions.filter(isConditionKey) : [],
    concentrationSpell: typeof item.concentrationSpell === "string" && item.concentrationSpell.trim() ? item.concentrationSpell.trim() : null,
    notes: typeof item.notes === "string" && item.notes.trim() ? item.notes.trim() : null,
    defeated: Boolean(item.defeated) || currentHP <= 0,
    legendaryActionsUsed: Math.max(0, Number(item.legendaryActionsUsed ?? 0) || 0),
    tokenX: Math.max(6, Math.min(94, Number(item.tokenX ?? 50) || 50)),
    tokenY: Math.max(8, Math.min(92, Number(item.tokenY ?? 50) || 50)),
    visionRadius: Math.max(8, Math.min(48, Number(item.visionRadius ?? 22) || 22)),
  } satisfies EncounterCombatant;
}

export function parseEncounterLiveState(value: unknown) {
  const item = asRecord(value);
  if (!item) return null;
  const combatants = Array.isArray(item.combatants)
    ? item.combatants
        .map((entry, index) => parseCombatant(entry, index))
        .filter((entry: EncounterCombatant | null): entry is EncounterCombatant => Boolean(entry))
    : [];
  return {
    round: Math.max(1, Number(item.round ?? 1) || 1),
    activeCombatantId: typeof item.activeCombatantId === "string" ? item.activeCombatantId : combatants[0]?.id ?? null,
    mapLocationId: typeof item.mapLocationId === "string" ? item.mapLocationId : null,
    lightingMode: isLightingMode(item.lightingMode) ? item.lightingMode : "bright",
    objective: typeof item.objective === "string" ? item.objective : "",
    environment: typeof item.environment === "string" ? item.environment : "",
    battlefieldNotes: typeof item.battlefieldNotes === "string" ? item.battlefieldNotes : "",
    lairActionInitiative: item.lairActionInitiative == null ? null : Number(item.lairActionInitiative),
    legendaryPool: Math.max(0, Number(item.legendaryPool ?? 0) || 0),
    legendaryRemaining: Math.max(0, Number(item.legendaryRemaining ?? item.legendaryPool ?? 0) || 0),
    recentEvents: Array.isArray(item.recentEvents) ? item.recentEvents.map((entry) => String(entry)).filter(Boolean).slice(0, 8) : [],
    combatants,
  } satisfies EncounterLiveState;
}

export function buildEncounterLiveState(
  monsters: EncounterMonster[],
  characters: EncounterTrackerCharacter[],
  mapLocationId?: string | null
) {
  const playerCombatants: EncounterCombatant[] = characters.map((character) => ({
    id: `player-${character.id}`,
    name: character.name,
    kind: "player",
    sourceId: character.id,
    initiative: character.initiative,
    currentHP: character.currentHP,
    maxHP: character.maxHP,
    armorClass: character.armorClass,
    conditions: Array.isArray(character.activeConditions) ? character.activeConditions.filter(isConditionKey) : [],
    concentrationSpell: character.concentrationSpell?.trim() || null,
    notes: null,
    defeated: character.currentHP <= 0,
    legendaryActionsUsed: 0,
    tokenX: 22,
    tokenY: 30 + playerCombatantsOffset(character.id, characters),
    visionRadius: 24,
  }));

  const monsterCombatants: EncounterCombatant[] = monsters.flatMap((monster) =>
    Array.from({ length: monster.count }, (_, index) => ({
      id: `monster-${monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      name: monster.count > 1 ? `${monster.name} ${index + 1}` : monster.name,
      kind: "monster" as const,
      sourceId: monster.name,
      initiative: 10,
      currentHP: monster.hp,
      maxHP: monster.hp,
      armorClass: monster.ac,
      conditions: [],
      concentrationSpell: null,
      notes: monster.notes?.trim() || null,
      defeated: false,
      legendaryActionsUsed: 0,
      tokenX: 74,
      tokenY: 24 + index * 10,
      visionRadius: 18,
    }))
  );

  const combatants = [...playerCombatants, ...monsterCombatants].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
  return {
    round: 1,
    activeCombatantId: combatants[0]?.id ?? null,
    mapLocationId: mapLocationId ?? null,
    lightingMode: "bright",
    objective: "",
    environment: "",
    battlefieldNotes: "",
    lairActionInitiative: null,
    legendaryPool: 0,
    legendaryRemaining: 0,
    recentEvents: [],
    combatants,
  } satisfies EncounterLiveState;
}

export function getEncounterLightingOpacity(mode: EncounterLightingMode) {
  switch (mode) {
    case "dark":
      return 0.78;
    case "dim":
      return 0.46;
    default:
      return 0;
  }
}

function playerCombatantsOffset(id: string, characters: EncounterTrackerCharacter[]) {
  const index = Math.max(
    0,
    characters.findIndex((character) => character.id === id)
  );
  return index * 10;
}

export function cycleEncounterTurn(state: EncounterLiveState, direction: 1 | -1 = 1) {
  if (state.combatants.length === 0) return state;
  const ordered = [...state.combatants].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
  const currentIndex = Math.max(0, ordered.findIndex((entry) => entry.id === state.activeCombatantId));
  const total = ordered.length;
  const nextIndex = (currentIndex + direction + total) % total;
  const wrapped = direction === 1 ? nextIndex <= currentIndex : nextIndex >= currentIndex;
  return {
    ...state,
    round: wrapped && direction === 1 ? state.round + 1 : Math.max(1, state.round - 1),
    activeCombatantId: ordered[nextIndex]?.id ?? state.activeCombatantId,
    legendaryRemaining: state.legendaryPool,
    combatants: ordered.map((entry) => ({ ...entry, legendaryActionsUsed: 0 })),
  } satisfies EncounterLiveState;
}
