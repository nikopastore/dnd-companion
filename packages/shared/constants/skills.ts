import type { AbilityKey } from "./abilities";

export interface Skill {
  key: string;
  name: string;
  ability: AbilityKey;
}

export const SKILLS: Skill[] = [
  { key: "acrobatics", name: "Acrobatics", ability: "dexterity" },
  { key: "animalHandling", name: "Animal Handling", ability: "wisdom" },
  { key: "arcana", name: "Arcana", ability: "intelligence" },
  { key: "athletics", name: "Athletics", ability: "strength" },
  { key: "deception", name: "Deception", ability: "charisma" },
  { key: "history", name: "History", ability: "intelligence" },
  { key: "insight", name: "Insight", ability: "wisdom" },
  { key: "intimidation", name: "Intimidation", ability: "charisma" },
  { key: "investigation", name: "Investigation", ability: "intelligence" },
  { key: "medicine", name: "Medicine", ability: "wisdom" },
  { key: "nature", name: "Nature", ability: "intelligence" },
  { key: "perception", name: "Perception", ability: "wisdom" },
  { key: "performance", name: "Performance", ability: "charisma" },
  { key: "persuasion", name: "Persuasion", ability: "charisma" },
  { key: "religion", name: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", name: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", name: "Stealth", ability: "dexterity" },
  { key: "survival", name: "Survival", ability: "wisdom" },
];
